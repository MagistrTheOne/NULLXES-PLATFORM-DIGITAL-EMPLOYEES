import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { db } from "@/shared/db/client";
import { knowledgeChunk, knowledgeSource } from "./schema";

const FAKE_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000001";
const FAKE_SOURCE_ID = "00000000-0000-0000-0000-000000000002";

async function verifyKnowledge(): Promise<void> {
  await db.select().from(knowledgeSource).limit(1);
  await db.select().from(knowledgeChunk).limit(1);
  console.log("knowledge_source and knowledge_chunk tables: accessible");

  const org = await createOrganization({
    name: "NULLXES Knowledge Verify Org",
    slug: `knowledge-verify-org-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Kaira",
      description: "Knowledge verify fixture employee",
      role: "Customer Support Employee",
      status: "draft",
      avatarProvider: "nullxes",
      brainProvider: "nullxes",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee");
  }
  console.log("Digital employee: created");

  const [source] = await db
    .insert(knowledgeSource)
    .values({
      employeeId: employee.id,
      type: "text",
      title: "Product FAQ",
      status: "ready",
    })
    .returning();

  if (!source) {
    throw new Error("Failed to create knowledge source");
  }
  console.log("Knowledge source: created");

  const chunks = await db
    .insert(knowledgeChunk)
    .values([
      {
        sourceId: source.id,
        content: "NULLXES Digital Employees operate at enterprise scale.",
        chunkIndex: 0,
      },
      {
        sourceId: source.id,
        content: "Each employee belongs to one organization.",
        chunkIndex: 1,
      },
    ])
    .returning();

  if (chunks.length !== 2) {
    throw new Error("Failed to create knowledge chunks");
  }
  console.log("Knowledge chunks: created");

  const sourceWithRelations = await db.query.knowledgeSource.findFirst({
    where: eq(knowledgeSource.id, source.id),
    with: { employee: true, chunks: true },
  });

  if (!sourceWithRelations?.employee || sourceWithRelations.employee.id !== employee.id) {
    throw new Error("Digital employee relation is invalid");
  }
  if (!sourceWithRelations.chunks || sourceWithRelations.chunks.length !== 2) {
    throw new Error("Knowledge chunk relation is invalid");
  }
  console.log("Relations: employee and chunks valid");

  try {
    await db.insert(knowledgeSource).values({
      employeeId: FAKE_EMPLOYEE_ID,
      type: "url",
      title: "Invalid Source",
      status: "pending",
    });
    throw new Error("Insert without valid employee should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Insert without valid employee should have failed")) {
      throw error;
    }
    console.log("Employee FK constraint: enforced");
  }

  try {
    await db.insert(knowledgeChunk).values({
      sourceId: FAKE_SOURCE_ID,
      content: "Orphan chunk",
      chunkIndex: 0,
    });
    throw new Error("Insert without valid source should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Insert without valid source should have failed")) {
      throw error;
    }
    console.log("Source FK constraint: enforced");
  }

  console.log("Knowledge verification: OK");
}

verifyKnowledge().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Knowledge verification failed:", message);
  process.exit(1);
});
