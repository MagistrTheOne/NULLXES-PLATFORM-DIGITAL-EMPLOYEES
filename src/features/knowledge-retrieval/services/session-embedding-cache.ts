type CacheEntry = {
  embedding: number[];
  expiresAt: number;
};

const CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 32;

const embeddingCache = new Map<string, CacheEntry>();

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function cacheKey(employeeId: string, query: string): string {
  return `${employeeId}:${normalizeQuery(query)}`;
}

function pruneCache(): void {
  if (embeddingCache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const oldestKey = embeddingCache.keys().next().value;
  if (oldestKey) {
    embeddingCache.delete(oldestKey);
  }
}

export function getCachedQueryEmbedding(
  employeeId: string,
  query: string,
): number[] | null {
  const key = cacheKey(employeeId, query);
  const entry = embeddingCache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    embeddingCache.delete(key);
    return null;
  }

  return entry.embedding;
}

export function setCachedQueryEmbedding(
  employeeId: string,
  query: string,
  embedding: number[],
): void {
  pruneCache();
  embeddingCache.set(cacheKey(employeeId, query), {
    embedding,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
