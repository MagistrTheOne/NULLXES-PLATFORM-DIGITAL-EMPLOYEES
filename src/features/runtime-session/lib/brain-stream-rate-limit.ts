const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 40;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function pruneExpired(now: number): void {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function assertBrainStreamRateLimit(input: {
  userId: string;
  employeeId: string;
}): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  pruneExpired(now);

  const key = `${input.userId}:${input.employeeId}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, error: "Too many talk requests. Please wait a moment." };
  }

  existing.count += 1;
  return { ok: true };
}
