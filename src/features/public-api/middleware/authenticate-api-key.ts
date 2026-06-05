import { verifyApiKey } from "@/features/security/services/api-key";
import { apiError } from "../lib/api-response";

export type ApiAuthContext = {
  organizationId: string;
  keyId: string;
  actorUserId: string;
};

export async function authenticateApiKeyRequest(
  request: Request,
): Promise<ApiAuthContext | Response> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return apiError("Missing Bearer API key", 401);
  }

  const rawKey = authorization.slice("Bearer ".length).trim();
  const verified = await verifyApiKey(rawKey);

  if (!verified) {
    return apiError("Invalid or revoked API key", 401);
  }

  return {
    organizationId: verified.organizationId,
    keyId: verified.keyId,
    actorUserId: verified.createdByUserId,
  };
}
