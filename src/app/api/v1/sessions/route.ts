import { authenticateApiKeyRequest } from "@/features/public-api/middleware/authenticate-api-key";
import { apiSuccess } from "@/features/public-api/lib/api-response";
import { listOrganizationSessions } from "@/features/public-api/services/list-organization-sessions";

export async function GET(request: Request): Promise<Response> {
  const auth = await authenticateApiKeyRequest(request, ["sessions:read"]);
  if (auth instanceof Response) {
    return auth;
  }

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "50")),
  );

  const sessions = await listOrganizationSessions(auth.organizationId, limit);

  return apiSuccess(
    sessions.map((session) => ({
      ...session,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
    })),
    { requestId: auth.requestId },
  );
}
