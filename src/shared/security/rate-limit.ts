/**
 * Fixed-window rate limiter.
 *
 * Production uses Upstash Redis REST for multi-instance enforcement.
 * When Redis is unset or unavailable:
 * - failOpen=true → process-local memory (Talk / docs reliability)
 * - failOpen=false → deny (Public API / Anam hard quotas)
 */

import { Redis } from "@upstash/redis";

type RateLimitInput = {
  /** Logical bucket name, e.g. "brain-stream". */
  name: string;
  /** Caller identity, e.g. `${userId}:${employeeId}`. */
  key: string;
  limit: number;
  windowMs: number;
  /**
   * On Redis miss/error: allow via memory (true) or deny (false).
   * Default false for hard multi-instance quotas.
   */
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

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

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

function memoryResult(
  bucketKey: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const count = incrementInMemory(bucketKey, windowMs);
  return count <= limit ? { ok: true } : { ok: false, reason: "limit" };
}

async function incrementInUpstash(
  redis: Redis,
  bucketKey: string,
  windowMs: number,
): Promise<number> {
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const count = await redis.incr(bucketKey);
  if (count === 1) {
    await redis.expire(bucketKey, ttlSeconds);
  }
  return count;
}

export async function checkRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const failOpen = input.failOpen === true;
  const windowStart = Math.floor(Date.now() / input.windowMs);
  const bucketKey = `rl:${input.name}:${input.key}:${windowStart}`;

  const redis = getRedis();
  if (!redis) {
    if (failOpen) {
      return memoryResult(bucketKey, input.limit, input.windowMs);
    }
    return { ok: false, reason: "limit" };
  }

  try {
    const count = await incrementInUpstash(redis, bucketKey, input.windowMs);
    return count <= input.limit
      ? { ok: true }
      : { ok: false, reason: "limit" };
  } catch {
    if (failOpen) {
      return memoryResult(bucketKey, input.limit, input.windowMs);
    }
    return { ok: false, reason: "limit" };
  }
}
