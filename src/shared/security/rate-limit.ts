/**
 * Fixed-window rate limiter (in-memory per instance).
 *
 * Redis / Upstash was removed — counters are process-local. On serverless this
 * softens limits across warm instances; that is intentional for Talk reliability.
 */

type RateLimitInput = {
  /** Logical bucket name, e.g. "brain-stream". */
  name: string;
  /** Caller identity, e.g. `${userId}:${employeeId}`. */
  key: string;
  limit: number;
  windowMs: number;
  /** Kept for call-site compatibility; unused (always memory). */
  failOpen?: boolean;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "limit" };

type MemoryEntry = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, MemoryEntry>();

function pruneExpired(now: number): void {
  for (const [key, entry] of memoryBuckets) {
    if (entry.resetAt <= now) {
      memoryBuckets.delete(key);
    }
  }
}

function incrementInMemory(bucketKey: string, windowMs: number): number {
  const now = Date.now();
  pruneExpired(now);

  const existing = memoryBuckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return 1;
  }

  existing.count += 1;
  return existing.count;
}

export async function checkRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const windowStart = Math.floor(Date.now() / input.windowMs);
  const bucketKey = `rl:${input.name}:${input.key}:${windowStart}`;
  const count = incrementInMemory(bucketKey, input.windowMs);
  return count <= input.limit
    ? { ok: true }
    : { ok: false, reason: "limit" };
}
