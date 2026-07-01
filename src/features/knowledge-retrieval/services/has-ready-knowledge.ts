import { and, eq, sql } from "drizzle-orm";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { db } from "@/shared/db/client";

const CACHE_TTL_MS = 60_000;

const cache = new Map<string, { value: boolean; expiresAt: number }>();

/**
 * Cheap guard before RAG: employees without ready knowledge sources skip the
 * embedding call and pgvector query entirely (saves 100-400ms per Talk turn).
 * Cached for 60s per employee; new uploads become searchable within a minute.
 */
export async function hasReadyKnowledge(employeeId: string): Promise<boolean> {
  const cached = cache.get(employeeId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const [row] = await db
    .select({ one: sql<number>`1` })
    .from(knowledgeSource)
    .where(
      and(
        eq(knowledgeSource.employeeId, employeeId),
        eq(knowledgeSource.status, "ready"),
      ),
    )
    .limit(1);

  const value = Boolean(row);
  cache.set(employeeId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export function invalidateReadyKnowledgeCache(employeeId: string): void {
  cache.delete(employeeId);
}
