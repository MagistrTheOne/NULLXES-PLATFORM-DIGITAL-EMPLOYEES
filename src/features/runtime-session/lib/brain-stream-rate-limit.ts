import { checkRateLimit } from "@/shared/security/rate-limit";
import type { TalkApiErrorCode } from "./talk-api-errors";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 40;

export async function assertBrainStreamRateLimit(input: {
  userId: string;
  employeeId: string;
  organizationId?: string;
}): Promise<
  | { ok: true }
  | { ok: false; code: TalkApiErrorCode; error: string }
> {
  const orgKey = input.organizationId?.trim() || "org";
  const result = await checkRateLimit({
    name: "brain-stream",
    key: `${orgKey}:${input.userId}:${input.employeeId}`,
    limit: MAX_REQUESTS_PER_WINDOW,
    windowMs: WINDOW_MS,
  });

  // Shared org bucket so one workspace cannot monopolize brain capacity.
  if (input.organizationId?.trim()) {
    const orgBucket = await checkRateLimit({
      name: "brain-stream-org",
      key: input.organizationId.trim(),
      limit: 120,
      windowMs: WINDOW_MS,
    });
    if (!orgBucket.ok) {
      return {
        ok: false,
        code: "RATE_LIMIT",
        error: "Too many talk requests for this workspace. Please wait a moment.",
      };
    }
  }

  if (!result.ok) {
    return {
      ok: false,
      code: "RATE_LIMIT",
      error: "Too many talk requests. Please wait a moment.",
    };
  }

  return { ok: true };
}
