/**
 * Soft Anam proxy buckets (optional).
 *
 * Disabled by default: Redis fail-closed and low caps previously surfaced as
 * "Platform Anam quota exceeded" / "Trial limit" and blocked real Talk while
 * Anam itself was fine. Re-enable with ANAM_PROXY_QUOTA_ENABLED=1.
 */

import { checkRateLimit } from "@/shared/security/rate-limit";

function isAnamProxyQuotaEnabled(): boolean {
  const raw = process.env.ANAM_PROXY_QUOTA_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

export async function consumeAnamProxyQuota(input: {
  subject: string;
  /** Max requests per minute for this subject. */
  perMinute?: number;
  /** Allow when Redis is down (default true — Talk must not die on Redis). */
  failOpen?: boolean;
}): Promise<{ ok: true } | { ok: false; reason: "limit" | "redis_unavailable" }> {
  if (!isAnamProxyQuotaEnabled()) {
    return { ok: true };
  }

  return checkRateLimit({
    name: "anam-proxy-bucket-v2",
    key: input.subject,
    limit: input.perMinute ?? 120,
    windowMs: 60_000,
    failOpen: input.failOpen ?? true,
  });
}

export async function consumePlatformAnamQuota(): Promise<
  { ok: true } | { ok: false; reason: "limit" | "redis_unavailable" }
> {
  if (!isAnamProxyQuotaEnabled()) {
    return { ok: true };
  }

  return checkRateLimit({
    name: "anam-proxy-platform-v2",
    key: "global",
    limit: 12_000,
    windowMs: 60_000,
    failOpen: true,
  });
}
