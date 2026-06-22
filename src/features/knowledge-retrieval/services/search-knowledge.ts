import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  knowledgeChunk,
  knowledgeSource,
} from "@/entities/knowledge/schema";
import { db } from "@/shared/db/client";
import {
  getOpenAiEmbeddingModel,
} from "@/shared/config/provider-env";
import type { KnowledgeSearchResult, SearchKnowledgeInput } from "../types";
import { embedTexts } from "./embed-text";
import {
  getCachedQueryEmbedding,
  setCachedQueryEmbedding,
} from "./session-embedding-cache";

type RawSearchRow = {
  chunk_id: string;
  source_id: string;
  source_title: string;
  content: string;
  similarity: number;
};

export async function searchKnowledge(
  input: SearchKnowledgeInput,
): Promise<KnowledgeSearchResult[]> {
  const topK = input.topK ?? 6;
  const query = input.query.trim();
  if (!query) {
    return [];
  }

  let queryEmbedding = input.useSessionCache
    ? getCachedQueryEmbedding(input.employeeId, query)
    : null;

  if (!queryEmbedding) {
    const embeddings = await embedTexts({ texts: [query] });
    queryEmbedding = embeddings[0];
    if (queryEmbedding && input.useSessionCache) {
      setCachedQueryEmbedding(input.employeeId, query, queryEmbedding);
    }
  }
  if (!queryEmbedding) {
    return [];
  }

  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const result = await db.execute(sql`
    SELECT
      kc.id AS chunk_id,
      ks.id AS source_id,
      ks.title AS source_title,
      kc.content AS content,
      1 - (kc.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM knowledge_chunk kc
    INNER JOIN knowledge_source ks ON ks.id = kc.source_id
    WHERE ks.employee_id = ${input.employeeId}
      AND ks.status = 'ready'
      AND kc.embedding IS NOT NULL
    ORDER BY kc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `);

  return (result.rows as RawSearchRow[]).map((row) => ({
    chunkId: row.chunk_id,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    content: row.content,
    similarity: Number(row.similarity),
  }));
}

export async function embedKnowledgeChunksForSource(
  sourceId: string,
): Promise<number> {
  const chunks = await db
    .select()
    .from(knowledgeChunk)
    .where(eq(knowledgeChunk.sourceId, sourceId))
    .orderBy(knowledgeChunk.chunkIndex);

  if (chunks.length === 0) {
    return 0;
  }

  const model = getOpenAiEmbeddingModel();
  const embeddings = await embedTexts({
    texts: chunks.map((chunk) => chunk.content),
  });

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const embedding = embeddings[index];
    if (!chunk || !embedding) {
      continue;
    }

    await db
      .update(knowledgeChunk)
      .set({
        embedding,
        embeddingModel: model,
        tokenCount: Math.ceil(chunk.content.length / 4),
      })
      .where(eq(knowledgeChunk.id, chunk.id));
  }

  return chunks.length;
}

export async function rechunkAndEmbedSource(sourceId: string): Promise<number> {
  const [source] = await db
    .select()
    .from(knowledgeSource)
    .where(eq(knowledgeSource.id, sourceId))
    .limit(1);

  if (!source) {
    throw new Error("Knowledge source not found");
  }

  const existingChunks = await db
    .select()
    .from(knowledgeChunk)
    .where(eq(knowledgeChunk.sourceId, sourceId))
    .orderBy(knowledgeChunk.chunkIndex);

  const combined = existingChunks.map((chunk) => chunk.content).join("\n\n");
  const { splitTextIntoChunks } = await import("./split-text-into-chunks");
  const splitChunks = splitTextIntoChunks(combined);

  if (splitChunks.length === 0) {
    throw new Error("Knowledge source has no embeddable content");
  }

  await db.delete(knowledgeChunk).where(eq(knowledgeChunk.sourceId, sourceId));

  const inserted = await db
    .insert(knowledgeChunk)
    .values(
      splitChunks.map((content, chunkIndex) => ({
        sourceId,
        content,
        chunkIndex,
      })),
    )
    .returning({ id: knowledgeChunk.id });

  if (inserted.length === 0) {
    throw new Error("Failed to recreate knowledge chunks");
  }

  return embedKnowledgeChunksForSource(sourceId);
}

export async function backfillReadySourcesWithoutEmbeddings(): Promise<number> {
  const readySources = await db
    .select({ id: knowledgeSource.id })
    .from(knowledgeSource)
    .where(eq(knowledgeSource.status, "ready"));

  let processed = 0;
  for (const source of readySources) {
    const chunks = await db
      .select({ id: knowledgeChunk.id, embedding: knowledgeChunk.embedding })
      .from(knowledgeChunk)
      .where(eq(knowledgeChunk.sourceId, source.id));

    if (chunks.length === 0) {
      continue;
    }

    const missingEmbeddings = chunks.some((chunk) => !chunk.embedding);
    if (!missingEmbeddings) {
      continue;
    }

    await embedKnowledgeChunksForSource(source.id);
    processed += 1;
  }

  return processed;
}
