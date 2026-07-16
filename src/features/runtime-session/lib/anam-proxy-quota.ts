/**
 * Token-bucket style limiter on top of fixed-window checkRateLimit.
 * Keys should be userId or demo:<subject>.
 */

import { checkRateLimit } from "@/shared/security/rate-limit";

export async function consumeAnamProxyQuota(input: {
  subject: string;
  /** Max requests per minute for this subject. */
  perMinute?: number;
  /** Allow when Redis is down (default true — Talk must not die on Redis). */
  failOpen?: boolean;
}): Promise<{ ok: true } | { ok: false; reason: "limit" | "redis_unavailable" }> {
  return checkRateLimit({
    name: "anam-proxy-bucket-v2",
    key: input.subject,
    limit: input.perMinute ?? 60,
    windowMs: 60_000,
    failOpen: input.failOpen ?? true,
  });
}

export async function consumePlatformAnamQuota(): Promise<
  { ok: true } | { ok: false; reason: "limit" | "redis_unavailable" }
> {
  // failOpen: Redis down must not block all Talk (message looked like Anam quota).
  return checkRateLimit({
    name: "anam-proxy-platform-v2",
    key: "global",
    limit: 6_000,
    windowMs: 60_000,
    failOpen: true,
  });
}
