import { eq } from "drizzle-orm";
import { knowledgeSource } from "@/entities/knowledge/schema";
import type { KnowledgeSourceStatus } from "@/entities/knowledge";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { assertKnowledgeStatusTransition } from "../services/assert-status-transition";
import { getKnowledgeSourceOrThrow } from "../services/get-knowledge-source";
import type {
  KnowledgeSourceStatusChangeResult,
  MarkKnowledgeFailedInput,
} from "../types";

export async function markKnowledgeFailed(
  input: MarkKnowledgeFailedInput,
): Promise<KnowledgeSourceStatusChangeResult> {
  if (!input.failureReason.trim()) {
    throw new Error("Failure reason is required");
  }

  return dbWithTransactions.transaction(async (tx) => {
    const existing = await getKnowledgeSourceOrThrow(tx, input.sourceId);
    const previousStatus = existing.status;
    const nextStatus: KnowledgeSourceStatus = "failed";

    assertKnowledgeStatusTransition(previousStatus, nextStatus);

    const [source] = await tx
      .update(knowledgeSource)
      .set({
        status: nextStatus,
        failureReason: input.failureReason,
      })
      .where(eq(knowledgeSource.id, input.sourceId))
      .returning();

    if (!source) {
      throw new Error("Failed to mark knowledge source as failed");
    }

    return { source, previousStatus, nextStatus };
  });
}
