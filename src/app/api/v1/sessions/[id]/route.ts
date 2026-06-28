import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { apiError, apiSuccess } from "@/features/public-api/lib/api-response";
import { getOrganizationSession } from "@/features/public-api/services/list-organization-sessions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["sessions:read"]);
  if (auth instanceof Response) {
    return auth;
  }

  const { id } = await context.params;
  const session = await getOrganizationSession(auth.organizationId, id);

  if (!session) {
    return apiError("Session not found", 404, { requestId: auth.requestId });
  }

  return apiSuccess(
    {
      ...session,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
    },
    { requestId: auth.requestId },
  );
}
