/**
 * Soft Anam proxy buckets (optional, in-memory).
 *
 * Off by default — re-enable with ANAM_PROXY_QUOTA_ENABLED=1.
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
  failOpen?: boolean;
}): Promise<{ ok: true } | { ok: false; reason: "limit" }> {
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
  { ok: true } | { ok: false; reason: "limit" }
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
