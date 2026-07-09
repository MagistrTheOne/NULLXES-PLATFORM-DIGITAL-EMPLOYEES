import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { planAllowsApiAccess } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { verifyApiKey } from "@/features/security/services/api-key";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { db } from "@/shared/db/client";
import { checkRateLimit } from "@/shared/security/rate-limit";
import { resolveTrustedClientIp } from "@/shared/security/resolve-trusted-client-ip";
import {
  assertApiScopes,
  type ApiScope,
} from "../lib/api-scopes";
import { apiError } from "../lib/api-response";

export type ApiAuthContext = {
  organizationId: string;
  keyId: string;
  actorUserId: string;
  scopes: ApiScope[];
  requestId: string;
};

const API_V1_RATE_LIMIT = 120;
const API_V1_WINDOW_MS = 60_000;

function parseAllowlist(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
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
  requiredScopes: readonly ApiScope[] = [],
): Promise<ApiAuthContext | Response> {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return apiError("Missing Bearer API key", 401, { requestId });
  }

  const rawKey = authorization.slice("Bearer ".length).trim();
  const verified = await verifyApiKey(rawKey);

  if (!verified) {
    return apiError("Invalid or revoked API key", 401, { requestId });
  }

  if (verified.expired) {
    recordAuditEvent({
      organizationId: verified.organizationId,
      actorUserId: verified.createdByUserId,
      action: "api.access.denied",
      resourceType: "api_key",
      resourceId: verified.keyId,
      metadata: {
        requestId,
        reason: "expired",
        path: new URL(request.url).pathname,
      },
      ipAddress: resolveTrustedClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return apiError("API key expired", 401, { requestId });
  }

  if (
    requiredScopes.length > 0 &&
    !assertApiScopes(verified.scopes, requiredScopes)
  ) {
    recordAuditEvent({
      organizationId: verified.organizationId,
      actorUserId: verified.createdByUserId,
      action: "api.access.denied",
      resourceType: "api_key",
      resourceId: verified.keyId,
      metadata: {
        requestId,
        reason: "insufficient_scope",
        requiredScopes,
        grantedScopes: verified.scopes,
        path: new URL(request.url).pathname,
      },
      ipAddress: resolveTrustedClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return apiError("Insufficient API key scope", 403, {
      requestId,
      requiredScopes,
    });
  }

  const [org] = await db
    .select({ billingPlan: organization.billingPlan })
    .from(organization)
    .where(eq(organization.id, verified.organizationId))
    .limit(1);

  const billingPlan = resolveBillingPlanId(org?.billingPlan ?? "free");
  const needsWrite = requiredScopes.some((scope) => scope.endsWith(":write"));
  if (!planAllowsApiAccess(billingPlan, needsWrite ? "full" : "read")) {
    recordAuditEvent({
      organizationId: verified.organizationId,
      actorUserId: verified.createdByUserId,
      action: "api.access.denied",
      resourceType: "api_key",
      resourceId: verified.keyId,
      metadata: {
        requestId,
        reason: "plan_api_access",
        billingPlan,
        path: new URL(request.url).pathname,
      },
      ipAddress: resolveTrustedClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return apiError(
      needsWrite
        ? "Full API access requires Scale or Enterprise"
        : "API access requires Team or higher",
      403,
      { requestId },
    );
  }

  const [settings] = await db
    .select({ apiIpAllowlist: organizationSettings.apiIpAllowlist })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, verified.organizationId))
    .limit(1);

  const allowlist = parseAllowlist(settings?.apiIpAllowlist);
  const clientIp = resolveTrustedClientIp(request);

  if (!isIpAllowed(clientIp, allowlist)) {
    recordAuditEvent({
      organizationId: verified.organizationId,
      actorUserId: verified.createdByUserId,
      action: "api.access.denied",
      resourceType: "api_key",
      resourceId: verified.keyId,
      metadata: {
        requestId,
        reason: "ip_not_allowed",
        path: new URL(request.url).pathname,
      },
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });
    return apiError("API access denied for this IP address", 403, { requestId });
  }

  const rateLimit = await checkRateLimit({
    name: "api-v1",
    key: verified.keyId,
    limit: API_V1_RATE_LIMIT,
    windowMs: API_V1_WINDOW_MS,
  });

  if (!rateLimit.ok) {
    recordAuditEvent({
      organizationId: verified.organizationId,
      actorUserId: verified.createdByUserId,
      action: "api.access.denied",
      resourceType: "api_key",
      resourceId: verified.keyId,
      metadata: {
        requestId,
        reason: "rate_limited",
        path: new URL(request.url).pathname,
      },
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });
    return apiError("Rate limit exceeded", 429, { requestId });
  }

  return {
    organizationId: verified.organizationId,
    keyId: verified.keyId,
    actorUserId: verified.createdByUserId,
    scopes: verified.scopes,
    requestId,
  };
}
