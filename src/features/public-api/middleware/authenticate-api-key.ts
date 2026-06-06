import { eq } from "drizzle-orm";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { verifyApiKey } from "@/features/security/services/api-key";
import { db } from "@/shared/db/client";
import { apiError } from "../lib/api-response";

export type ApiAuthContext = {
  organizationId: string;
  keyId: string;
  actorUserId: string;
};

function parseAllowlist(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function resolveClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}

function isIpAllowed(clientIp: string | null, allowlist: string[]): boolean {
  if (allowlist.length === 0) {
    return true;
  }

  if (!clientIp) {
    return false;
  }

  return allowlist.includes(clientIp);
}

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

  const [settings] = await db
    .select({ apiIpAllowlist: organizationSettings.apiIpAllowlist })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, verified.organizationId))
    .limit(1);

  const allowlist = parseAllowlist(settings?.apiIpAllowlist);
  const clientIp = resolveClientIp(request);

  if (!isIpAllowed(clientIp, allowlist)) {
    return apiError("API access denied for this IP address", 403);
  }

  return {
    organizationId: verified.organizationId,
    keyId: verified.keyId,
    actorUserId: verified.createdByUserId,
  };
}
