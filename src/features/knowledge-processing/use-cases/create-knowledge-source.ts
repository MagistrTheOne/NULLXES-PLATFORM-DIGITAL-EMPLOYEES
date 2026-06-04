import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { dbWithTransactions } from "@/shared/db/pool-client";
import type {
  CreateKnowledgeSourceInput,
  CreateKnowledgeSourceResult,
} from "../types";

export async function createKnowledgeSource(
  input: CreateKnowledgeSourceInput,
): Promise<CreateKnowledgeSourceResult> {
  if (input.chunks.length === 0) {
    throw new Error("Knowledge source requires at least one chunk");
  }

  return dbWithTransactions.transaction(async (tx) => {
    const [source] = await tx
      .insert(knowledgeSource)
      .values({
        employeeId: input.employeeId,
        type: input.type,
        title: input.title,
        status: "pending",
      })
      .returning();

    if (!source) {
      throw new Error("Failed to create knowledge source");
    }

    const chunkValues = input.chunks.map((chunk, index) => ({
      sourceId: source.id,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex ?? index,
    }));

    const chunks = await tx.insert(knowledgeChunk).values(chunkValues).returning();

    if (chunks.length !== input.chunks.length) {
      throw new Error("Failed to create knowledge chunks");
    }

    return {
      source,
      chunks,
      lifecycleStatus: source.status,
    };
  });
}
