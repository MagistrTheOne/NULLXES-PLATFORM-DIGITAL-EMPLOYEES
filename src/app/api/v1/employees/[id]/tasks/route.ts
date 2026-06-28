import {
  createEmployeeTask,
  enqueueEmployeeTask,
} from "@/features/agent-tasks";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { apiError, apiSuccess } from "@/features/public-api/lib/api-response";
import { recordWorkEvent } from "@/features/work-event";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["tasks:write"]);
  if (auth instanceof Response) {
    return auth;
  }

  const { id: employeeId } = await context.params;
  const employee = await getEmployeeDetail(auth.organizationId, employeeId);
  if (!employee) {
    return apiError("Employee not found", 404, { requestId: auth.requestId });
  }

  let body: {
    title?: string;
    message?: string;
    dueAt?: string;
    callbackUrl?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Invalid JSON body", 400, { requestId: auth.requestId });
  }

  const title = body.title?.trim();
  const message = body.message?.trim();
  if (!title || !message) {
    return apiError("title and message are required", 400, {
      requestId: auth.requestId,
    });
  }

  const dueAt = body.dueAt ? new Date(body.dueAt) : undefined;
  if (dueAt && Number.isNaN(dueAt.getTime())) {
    return apiError("dueAt must be a valid ISO date", 400, {
      requestId: auth.requestId,
    });
  }

  const taskId = await createEmployeeTask({
    organizationId: auth.organizationId,
    employeeId,
    title,
    description: message,
    source: "api",
    dueAt,
    callbackUrl: body.callbackUrl?.trim() || undefined,
  });

  await enqueueEmployeeTask({
    taskId,
    organizationId: auth.organizationId,
    dueAt,
  });

  await recordWorkEvent({
    organizationId: auth.organizationId,
    employeeId,
    taskId,
    eventType: "task_received",
    title,
    summary: message,
    metadata: { source: "api", callbackUrl: body.callbackUrl ?? null },
  });

  recordAuditEvent({
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    action: "api.task.enqueued",
    resourceType: "employee_task",
    resourceId: taskId,
    metadata: {
      employeeId,
      requestId: auth.requestId,
      keyId: auth.keyId,
    },
  });

  return apiSuccess(
    {
      taskId,
      status: dueAt && dueAt.getTime() > Date.now() ? "scheduled" : "queued",
    },
    { requestId: auth.requestId },
  );
}
