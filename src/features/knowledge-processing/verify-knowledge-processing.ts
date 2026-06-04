import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeChunk, knowledgeSource } from "@/entities/knowledge/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { db } from "@/shared/db/client";
import {
  createKnowledgeSource,
  markKnowledgeFailed,
  markKnowledgeReady,
  startKnowledgeProcessing,
} from "./use-cases";

async function expectInvalidTransition(
  label: string,
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    await action();
    throw new Error(`${label}: expected invalid transition to fail`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("expected invalid transition to fail")) {
      throw error;
    }
    if (!message.includes("Invalid knowledge source status transition")) {
      throw error;
    }
  }
  console.log(`${label}: rejected`);
}

async function verifyKnowledgeProcessing(): Promise<void> {
  const org = await createOrganization({
    name: "NULLXES Knowledge Processing Verify Org",
    slug: `knowledge-processing-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Lili",
      description: "Knowledge processing verify fixture",
      role: "Data Analyst",
      status: "active",
      avatarProvider: "nullxes",
      brainProvider: "nullxes",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee");
  }
  console.log("Digital employee: created");

  const created = await createKnowledgeSource({
    employeeId: employee.id,
    type: "text",
    title: "Operations Handbook",
    chunks: [
      { content: "NULLXES Digital Employees follow enterprise policies." },
      { content: "Knowledge sources progress through a processing lifecycle." },
    ],
  });

  if (created.lifecycleStatus !== "pending" || created.chunks.length !== 2) {
    throw new Error("CreateKnowledgeSource did not initialize lifecycle and chunks");
  }
  console.log("CreateKnowledgeSource: source, chunks, pending lifecycle");

  const sourceWithChunks = await db.query.knowledgeSource.findFirst({
    where: eq(knowledgeSource.id, created.source.id),
    with: { chunks: true },
  });

  if (!sourceWithChunks?.chunks || sourceWithChunks.chunks.length !== 2) {
    throw new Error("Knowledge chunks were not persisted with source");
  }
  console.log("Knowledge chunks: persisted");

  await expectInvalidTransition("pending -> ready", () =>
    markKnowledgeReady({ sourceId: created.source.id }),
  );

  const processing = await startKnowledgeProcessing({
    sourceId: created.source.id,
  });

  if (processing.nextStatus !== "processing") {
    throw new Error("StartKnowledgeProcessing did not move to processing");
  }
  console.log("StartKnowledgeProcessing: pending -> processing");

  await expectInvalidTransition("processing -> processing", () =>
    startKnowledgeProcessing({ sourceId: created.source.id }),
  );

  const ready = await markKnowledgeReady({ sourceId: created.source.id });

  if (ready.nextStatus !== "ready" || ready.source.failureReason !== null) {
    throw new Error("MarkKnowledgeReady did not complete lifecycle");
  }
  console.log("MarkKnowledgeReady: processing -> ready");

  await expectInvalidTransition("ready -> processing", () =>
    startKnowledgeProcessing({ sourceId: created.source.id }),
  );

  const failedFixture = await createKnowledgeSource({
    employeeId: employee.id,
    type: "file",
    title: "Corrupted Upload",
    chunks: [{ content: "Unreadable binary payload." }],
  });

  await startKnowledgeProcessing({ sourceId: failedFixture.source.id });

  const failed = await markKnowledgeFailed({
    sourceId: failedFixture.source.id,
    failureReason: "Chunk normalization failed: invalid encoding",
  });

  if (
    failed.nextStatus !== "failed" ||
    failed.source.failureReason !==
      "Chunk normalization failed: invalid encoding"
  ) {
    throw new Error("MarkKnowledgeFailed did not store failure state");
  }
  console.log("MarkKnowledgeFailed: processing -> failed with reason");

  await expectInvalidTransition("failed -> ready", () =>
    markKnowledgeReady({ sourceId: failedFixture.source.id }),
  );

  const chunkCount = await db
    .select()
    .from(knowledgeChunk)
    .where(eq(knowledgeChunk.sourceId, created.source.id));

  if (chunkCount.length !== 2) {
    throw new Error("Knowledge chunk retrieval failed");
  }
  console.log("Knowledge processing verification: OK");
}

verifyKnowledgeProcessing().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Knowledge processing verification failed:", message);
  process.exit(1);
});
