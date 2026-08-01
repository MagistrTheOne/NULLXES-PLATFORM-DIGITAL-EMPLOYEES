import {
  isLandingTalkDisabled,
  landingTalkDisabledMessage,
} from "@/shared/security/agent-runtime-kill-switch";
import { checkRateLimit } from "@/shared/security/rate-limit";
import { resolvePublicClientIpKey } from "@/shared/security/resolve-trusted-client-ip";

/**
 * Per-IP trial mint cap for public landing Talk (Anam spend control).
 * Fail-closed: deny when Redis is unavailable (abuse surface).
 */
export async function assertLandingTalkRateLimit(
  request: Request,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (isLandingTalkDisabled()) {
    return {
      ok: false,
      status: 503,
      error: landingTalkDisabledMessage(),
    };
  }

  const ipKey = resolvePublicClientIpKey(request);
  const result = await checkRateLimit({
    name: "landing-talk-mint",
    key: ipKey,
    limit: 8,
    windowMs: 60 * 60 * 1000,
    failOpen: false,
  });

  if (!result.ok) {
    return {
      ok: false,
      status: 429,
      error: "Talk trial rate limit reached. Try again later.",
    };
  }

  return { ok: true };
}
