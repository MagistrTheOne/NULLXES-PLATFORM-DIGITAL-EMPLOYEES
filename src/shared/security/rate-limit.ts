/**
 * Fixed-window rate limiter.
 *
 * On serverless every instance has its own memory, so a Map-based limiter
 * multiplies the effective limit by the number of warm instances. When Redis
 * is linked via the Vercel ↔ Upstash integration, counters are shared across
 * instances. Without Redis we fall back to the in-memory window (dev / solo).
 * In production, Redis is required at boot and a missing/failing Redis client
 * fails closed so limits are not silently bypassed via per-instance memory.
 */

import { getRedisRestClient } from "@/shared/config/redis-rest";

type RateLimitInput = {
  /** Logical bucket name, e.g. "brain-stream". */
  name: string;
  /** Caller identity, e.g. `${userId}:${employeeId}`. */
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = { ok: true } | { ok: false };

async function incrementInRedis(
  redisKey: string,
  windowMs: number,
): Promise<number | null> {
  const redis = getRedisRestClient();
  if (!redis) {
    return null;
  }

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }
    return count;
  } catch {
    return null;
  }
}

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

function mustDenyWhenRedisUnavailable(): boolean {
  // Production must use shared Redis counters — never fall back to per-instance memory.
  return process.env.NODE_ENV === "production";
}

export async function checkRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const windowStart = Math.floor(Date.now() / input.windowMs);
  const bucketKey = `rl:${input.name}:${input.key}:${windowStart}`;
  const denyWithoutWorkingRedis = mustDenyWhenRedisUnavailable();

  const redis = getRedisRestClient();
  if (redis) {
    const count = await incrementInRedis(bucketKey, input.windowMs);
    if (count !== null) {
      return count <= input.limit ? { ok: true } : { ok: false };
    }
  }

  if (denyWithoutWorkingRedis) {
    return { ok: false };
  }

  const count = incrementInMemory(bucketKey, input.windowMs);
  return count <= input.limit ? { ok: true } : { ok: false };
}
