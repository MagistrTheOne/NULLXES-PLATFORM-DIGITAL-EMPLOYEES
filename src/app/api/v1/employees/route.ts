import { listOrganizationEmployees } from "@/features/employees/services/list-organization-employees";
import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { apiError, apiJson } from "@/features/public-api/lib/api-response";
import { createApiEmployee } from "@/features/public-api/services/create-api-employee";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request);
  if (auth instanceof Response) {
    return auth;
  }

  const page = await listOrganizationEmployees(auth.organizationId);

  return apiJson({
    data: page.items.map((employee) => ({
      ...employee,
      createdAt: employee.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request);
  if (auth instanceof Response) {
    return auth;
  }

  let body: { name?: string; role?: string; description?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const result = await createApiEmployee({
    organizationId: auth.organizationId,
    actorUserId: auth.actorUserId,
    name: body.name ?? "",
    role: body.role ?? "",
    description: body.description,
  });

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  void dispatchOrganizationWebhook({
    organizationId: auth.organizationId,
    event: "employee.created",
    data: {
      employeeId: result.employeeId,
      source: "api",
    },
  });

  return apiJson({ data: { id: result.employeeId } }, { status: 201 });
}
