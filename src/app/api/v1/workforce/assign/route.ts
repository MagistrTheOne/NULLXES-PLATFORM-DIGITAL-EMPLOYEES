import {
  createEmployeeTask,
  enqueueEmployeeTask,
} from "@/features/agent-tasks";
import { resolveWorkforceAssignee } from "@/features/agent-router/services/resolve-workforce-assignee";
import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { apiError, apiSuccess } from "@/features/public-api/lib/api-response";
import { recordWorkEvent } from "@/features/work-event";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["tasks:write"]);
  if (auth instanceof Response) {
    return auth;
  }

  let body: {
    message?: string;
    title?: string;
    employeeId?: string;
    dueAt?: string;
    callbackUrl?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Invalid JSON body", 400, { requestId: auth.requestId });
  }

  const message = body.message?.trim();
  const title = body.title?.trim() || "Workforce assignment";
  if (!message) {
    return apiError("message is required", 400, { requestId: auth.requestId });
  }

  const assignee = await resolveWorkforceAssignee({
    organizationId: auth.organizationId,
    message,
    preferredEmployeeId: body.employeeId?.trim() || undefined,
  });

  if (!assignee) {
    return apiError("No digital employees available for assignment", 404, {
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
    employeeId: assignee.employeeId,
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
    employeeId: assignee.employeeId,
    taskId,
    eventType: "task_received",
    title,
    summary: message,
    metadata: {
      source: "workforce_router",
      routedScore: assignee.score,
      routedRole: assignee.role,
    },
  });

  recordAuditEvent({
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    action: "api.task.enqueued",
    resourceType: "employee_task",
    resourceId: taskId,
    metadata: {
      employeeId: assignee.employeeId,
      requestId: auth.requestId,
      keyId: auth.keyId,
      route: "workforce.assign",
    },
  });

  return apiSuccess(
    {
      taskId,
      employeeId: assignee.employeeId,
      employeeName: assignee.name,
      employeeRole: assignee.role,
      routeScore: assignee.score,
      status: dueAt && dueAt.getTime() > Date.now() ? "scheduled" : "queued",
    },
    { requestId: auth.requestId },
  );
}
