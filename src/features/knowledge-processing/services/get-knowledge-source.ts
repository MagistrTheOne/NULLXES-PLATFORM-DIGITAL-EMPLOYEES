import { eq } from "drizzle-orm";
import { knowledgeSource } from "@/entities/knowledge/schema";
import type { KnowledgeSource } from "@/entities/knowledge";
import { dbWithTransactions } from "@/shared/db/pool-client";

type DbClient = typeof dbWithTransactions;

export async function getKnowledgeSourceOrThrow(
  client: DbClient,
  sourceId: string,
): Promise<KnowledgeSource> {
  const [source] = await client
    .select()
    .from(knowledgeSource)
    .where(eq(knowledgeSource.id, sourceId))
    .limit(1);

  if (!source) {
    throw new Error("Knowledge source not found");
  }

  return source;
}
