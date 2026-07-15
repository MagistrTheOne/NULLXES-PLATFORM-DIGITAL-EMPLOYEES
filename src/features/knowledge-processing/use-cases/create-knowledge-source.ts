import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { assertCanAddKnowledgeChunksForEmployee } from "@/features/billing/services/assert-knowledge-chunk-limit";
import { forbidCatalogMutation } from "@/features/employees/services/platform-employee-catalog";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { db } from "@/shared/db/client";
import { enqueueKnowledgeProcessing } from "../services/enqueue-knowledge-processing";
import type {
  CreateKnowledgeSourceInput,
  CreateKnowledgeSourceResult,
} from "../types";

export async function createKnowledgeSource(
  input: CreateKnowledgeSourceInput,
): Promise<CreateKnowledgeSourceResult> {
  await forbidCatalogMutation(input.employeeId, input.organizationId);

  if (input.chunks.length === 0) {
    throw new Error("Knowledge source requires at least one chunk");
  }

  const limitCheck = await assertCanAddKnowledgeChunksForEmployee(
    input.employeeId,
    input.chunks.length,
  );
  if (!limitCheck.ok) {
    throw new Error(limitCheck.message);
  }

  const result = await dbWithTransactions.transaction(async (tx) => {
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

  const [employee] = await db
    .select({ organizationId: digitalEmployee.organizationId })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, input.employeeId))
    .limit(1);

  if (employee) {
    const orgSettings = await ensureOrganizationSettings(employee.organizationId);
    if (orgSettings.knowledgeProcessing !== "manual") {
      await enqueueKnowledgeProcessing(result.source.id);
    }
  } else {
    await enqueueKnowledgeProcessing(result.source.id);
  }

  return result;
}
