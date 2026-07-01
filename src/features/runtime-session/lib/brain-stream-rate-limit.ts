import { checkRateLimit } from "@/shared/security/rate-limit";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 40;

export async function assertBrainStreamRateLimit(input: {
  userId: string;
  employeeId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await checkRateLimit({
    name: "brain-stream",
    key: `${input.userId}:${input.employeeId}`,
    limit: MAX_REQUESTS_PER_WINDOW,
    windowMs: WINDOW_MS,
  });

  if (!result.ok) {
    return { ok: false, error: "Too many talk requests. Please wait a moment." };
  }

  return { ok: true };
}
