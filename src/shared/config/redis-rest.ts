import { Redis } from "@upstash/redis";

/**
 * REST Redis client for serverless (rate limits, shared counters).
 *
 * Credentials come from the Vercel ↔ Upstash Redis integration — link Storage
 * in the project dashboard and Vercel injects the REST URL/token automatically.
 * No manual copy/paste of Upstash keys is required.
 *
 * Legacy Vercel KV aliases (`KV_REST_*`) are still accepted when present.
 */

let cached: Redis | null | undefined;

function resolveRedisRestCredentials(): { url: string; token: string } | null {
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

/** True when Vercel Storage / Upstash integration has linked Redis to this project. */
export function isRedisRestLinked(): boolean {
  return resolveRedisRestCredentials() !== null;
}

export function getRedisRestClient(): Redis | null {
  if (cached !== undefined) {
    return cached;
  }

  const credentials = resolveRedisRestCredentials();
  if (!credentials) {
    cached = null;
    return null;
  }

  cached = new Redis({ url: credentials.url, token: credentials.token });
  return cached;
}
