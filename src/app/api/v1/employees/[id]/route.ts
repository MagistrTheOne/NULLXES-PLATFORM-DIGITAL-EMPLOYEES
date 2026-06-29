import type { BrainProvider, EmployeeStatus } from "@/entities/digital-employee";
import { deleteEmployee } from "@/features/employees/services/delete-employee";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";
import { updateEmployee } from "@/features/employees/services/update-employee";
import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { apiError, apiSuccess } from "@/features/public-api/lib/api-response";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["employees:read"]);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  const employee = await getEmployeeDetail(auth.organizationId, id);

  if (!employee) {
    return apiError("Employee not found", 404, { requestId: auth.requestId });
  }

  return apiSuccess(
    {
      ...employee,
      createdAt: employee.createdAt.toISOString(),
      knowledge: employee.knowledge.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      lifecycle: employee.lifecycle.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    },
    { requestId: auth.requestId },
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["employees:write"]);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  let body: {
    name?: string;
    role?: string;
    description?: string | null;
    status?: EmployeeStatus;
    systemPrompt?: string;
    brainProvider?: BrainProvider;
    brainModel?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Invalid JSON body", 400, { requestId: auth.requestId });
  }

  const existing = await getEmployeeDetail(auth.organizationId, id);
  if (!existing) {
    return apiError("Employee not found", 404, { requestId: auth.requestId });
  }

  const result = await updateEmployee({
    organizationId: auth.organizationId,
    employeeId: id,
    actorUserId: auth.actorUserId,
    name: body.name?.trim() || existing.name,
    role: body.role?.trim() || existing.role,
    description:
      body.description === undefined
        ? existing.description
        : body.description,
    status: body.status ?? existing.status,
    systemPrompt: body.systemPrompt ?? existing.systemPrompt,
    brainProvider: body.brainProvider ?? existing.brainProvider,
    brainModel: body.brainModel ?? existing.brainModel ?? "gpt-4.1-mini",
  });

  if (!result.ok) {
    return apiError(result.message, 400, { requestId: auth.requestId });
  }

  recordAuditEvent({
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    action: "settings.updated",
    resourceType: "digital_employee",
    resourceId: id,
    metadata: {
      source: "api",
      requestId: auth.requestId,
      keyId: auth.keyId,
    },
  });

  return apiSuccess({ id, updated: true }, { requestId: auth.requestId });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["employees:write"]);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  const result = await deleteEmployee(auth.organizationId, id);

  if (!result.ok) {
    return apiError(result.message, 404, { requestId: auth.requestId });
  }

  recordAuditEvent({
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    action: "employee.deleted",
    resourceType: "digital_employee",
    resourceId: id,
    metadata: {
      source: "api",
      requestId: auth.requestId,
      keyId: auth.keyId,
    },
  });

  void dispatchOrganizationWebhook({
    organizationId: auth.organizationId,
    event: "employee.deleted",
    data: { employeeId: id, source: "api" },
  });

  return apiSuccess({ id, deleted: true }, { requestId: auth.requestId });
}
