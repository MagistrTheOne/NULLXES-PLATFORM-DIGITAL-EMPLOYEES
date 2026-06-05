import { count, eq, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { db } from "@/shared/db/client";
import type { KnowledgeMetrics } from "../types";

export async function getKnowledgeMetrics(
  organizationId: string,
): Promise<KnowledgeMetrics> {
  const [sourceRow] = await db
    .select({
      totalSources: count(knowledgeSource.id),
      readySources:
        sql<number>`count(*) filter (where ${knowledgeSource.status} = 'ready')`.mapWith(
          Number,
        ),
      processingSources:
        sql<number>`count(*) filter (where ${knowledgeSource.status} = 'processing')`.mapWith(
          Number,
        ),
      failedSources:
        sql<number>`count(*) filter (where ${knowledgeSource.status} = 'failed')`.mapWith(
          Number,
        ),
    })
    .from(knowledgeSource)
    .innerJoin(
      digitalEmployee,
      eq(knowledgeSource.employeeId, digitalEmployee.id),
    )
    .where(eq(digitalEmployee.organizationId, organizationId));

  const [chunkRow] = await db
    .select({
      totalChunks: count(knowledgeChunk.id),
    })
    .from(knowledgeChunk)
    .innerJoin(knowledgeSource, eq(knowledgeChunk.sourceId, knowledgeSource.id))
    .innerJoin(
      digitalEmployee,
      eq(knowledgeSource.employeeId, digitalEmployee.id),
    )
    .where(eq(digitalEmployee.organizationId, organizationId));

  return {
    totalSources: Number(sourceRow?.totalSources ?? 0),
    readySources: Number(sourceRow?.readySources ?? 0),
    processingSources: Number(sourceRow?.processingSources ?? 0),
    failedSources: Number(sourceRow?.failedSources ?? 0),
    totalChunks: Number(chunkRow?.totalChunks ?? 0),
  };
}
