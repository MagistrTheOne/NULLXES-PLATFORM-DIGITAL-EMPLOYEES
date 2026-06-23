import { and, eq } from "drizzle-orm";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { db } from "@/shared/db/client";
import { enqueueKnowledgeProcessing } from "./enqueue-knowledge-processing";

export async function enqueuePendingKnowledgeForEmployee(
  employeeId: string,
): Promise<void> {
  const sources = await db
    .select({ id: knowledgeSource.id })
    .from(knowledgeSource)
    .where(
      and(
        eq(knowledgeSource.employeeId, employeeId),
        eq(knowledgeSource.status, "pending"),
      ),
    );

  for (const source of sources) {
    await enqueueKnowledgeProcessing(source.id);
  }
}
