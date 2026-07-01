/**
 * Fixed-window rate limiter.
 *
 * On serverless every instance has its own memory, so a Map-based limiter
 * multiplies the effective limit by the number of warm instances. When an
 * Upstash-compatible Redis REST endpoint is configured (Upstash direct or
 * Vercel KV / Marketplace aliases), counters are shared across instances.
 * Without it we fall back to the in-memory window, and on Redis errors we
 * fail open: rate limiting must never take the endpoint down.
 */

type RateLimitInput = {
  /** Logical bucket name, e.g. "brain-stream". */
  name: string;
  /** Caller identity, e.g. `${userId}:${employeeId}`. */
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = { ok: true } | { ok: false };

type RedisRestConfig = {
  url: string;
  token: string;
};

function resolveRedisRestConfig(): RedisRestConfig | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url: url.replace(/\/$/, ""), token };
}

async function incrementInRedis(
  config: RedisRestConfig,
  redisKey: string,
  windowMs: number,
): Promise<number | null> {
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, windowMs.toString(), "NX"],
      ]),
      signal: AbortSignal.timeout(1_500),
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{
      result?: unknown;
      error?: string;
    }>;
    const count = results?.[0]?.result;

    return typeof count === "number" ? count : null;
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

export async function checkRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const windowStart = Math.floor(Date.now() / input.windowMs);
  const bucketKey = `rl:${input.name}:${input.key}:${windowStart}`;

  const redisConfig = resolveRedisRestConfig();

  if (redisConfig) {
    const count = await incrementInRedis(redisConfig, bucketKey, input.windowMs);
    if (count !== null) {
      return count <= input.limit ? { ok: true } : { ok: false };
    }
    // Redis unreachable: fall through to the local window (fail open-ish).
  }

  const count = incrementInMemory(bucketKey, input.windowMs);
  return count <= input.limit ? { ok: true } : { ok: false };
}
