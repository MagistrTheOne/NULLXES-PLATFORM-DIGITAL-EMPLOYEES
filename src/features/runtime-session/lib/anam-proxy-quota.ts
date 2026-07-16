/**
 * Token-bucket style limiter on top of fixed-window checkRateLimit.
 * Keys should be userId or demo:<subject>.
 */

import { checkRateLimit } from "@/shared/security/rate-limit";

export async function consumeAnamProxyQuota(input: {
  subject: string;
  /** Max requests per minute for this subject. */
  perMinute?: number;
  /** Landing demos: allow when Redis is down. */
  failOpen?: boolean;
}): Promise<{ ok: true } | { ok: false; reason: "limit" | "redis_unavailable" }> {
  return checkRateLimit({
    name: "anam-proxy-bucket",
    key: input.subject,
    limit: input.perMinute ?? 60,
    windowMs: 60_000,
    failOpen: input.failOpen,
  });
}

export async function consumePlatformAnamQuota(): Promise<
  { ok: true } | { ok: false; reason: "limit" | "redis_unavailable" }
> {
  return checkRateLimit({
    name: "anam-proxy-platform",
    key: "global",
    limit: 1_200,
    windowMs: 60_000,
  });
}
