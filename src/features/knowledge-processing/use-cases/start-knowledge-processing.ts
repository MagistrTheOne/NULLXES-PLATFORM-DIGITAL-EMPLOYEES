import { eq } from "drizzle-orm";
import { knowledgeSource } from "@/entities/knowledge/schema";
import type { KnowledgeSourceStatus } from "@/entities/knowledge";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { assertKnowledgeStatusTransition } from "../services/assert-status-transition";
import { getKnowledgeSourceOrThrow } from "../services/get-knowledge-source";
import type {
  KnowledgeSourceStatusChangeResult,
  StartKnowledgeProcessingInput,
} from "../types";

export async function startKnowledgeProcessing(
  input: StartKnowledgeProcessingInput,
): Promise<KnowledgeSourceStatusChangeResult> {
  return dbWithTransactions.transaction(async (tx) => {
    const existing = await getKnowledgeSourceOrThrow(tx, input.sourceId);
    const previousStatus = existing.status;
    const nextStatus: KnowledgeSourceStatus = "processing";

    assertKnowledgeStatusTransition(previousStatus, nextStatus);

    const [source] = await tx
      .update(knowledgeSource)
      .set({ status: nextStatus, failureReason: null })
      .where(eq(knowledgeSource.id, input.sourceId))
      .returning();

    if (!source) {
      throw new Error("Failed to start knowledge processing");
    }

    return { source, previousStatus, nextStatus };
  });
}
