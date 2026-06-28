import { listOrganizationEmployees } from "@/features/employees/services/list-organization-employees";
import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { apiError, apiSuccess } from "@/features/public-api/lib/api-response";
import { createApiEmployee } from "@/features/public-api/services/create-api-employee";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["employees:read"]);
  if (auth instanceof Response) {
    return auth;
  }

  const page = await listOrganizationEmployees(auth.organizationId);

  return apiSuccess(
    page.items.map((employee) => ({
      ...employee,
      createdAt: employee.createdAt.toISOString(),
    })),
    { requestId: auth.requestId },
  );
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["employees:write"]);
  if (auth instanceof Response) {
    return auth;
  }

  let body: { name?: string; role?: string; description?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Invalid JSON body", 400, { requestId: auth.requestId });
  }

  const result = await createApiEmployee({
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    name: body.name ?? "",
    role: body.role ?? "",
    description: body.description,
  });

  if (!result.ok) {
    return apiError(result.message, result.status, { requestId: auth.requestId });
  }

  recordAuditEvent({
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    action: "employee.created",
    resourceType: "digital_employee",
    resourceId: result.employeeId,
    metadata: {
      source: "api",
      requestId: auth.requestId,
      keyId: auth.keyId,
    },
  });

  void dispatchOrganizationWebhook({
    organizationId: auth.organizationId,
    event: "employee.created",
    data: {
      employeeId: result.employeeId,
      source: "api",
    },
  });

  return apiSuccess({ id: result.employeeId }, {
    status: 201,
    requestId: auth.requestId,
  });
}
