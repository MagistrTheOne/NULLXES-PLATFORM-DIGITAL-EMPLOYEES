import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { employeeRuntime } from "@/entities/runtime/schema";
import {
  createKnowledgeSource,
  markKnowledgeReady,
  startKnowledgeProcessing,
} from "@/features/knowledge-processing";
import { db } from "@/shared/db/client";
import { buildEmployeeRuntimeContext } from "./services";

async function verifyRuntimeEngine(): Promise<void> {
  const org = await createOrganization({
    name: "NULLXES Runtime Engine Verify Org",
    slug: `runtime-engine-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Kaira",
      description: "Runtime engine verification fixture",
      role: "Customer Support Employee",
      status: "active",
      avatarProvider: "anam",
      brainProvider: "openai",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee fixture");
  }
  console.log("Digital employee fixture: created");

  await db.insert(employeeRuntime).values({
    employeeId: employee.id,
    brainProvider: "openai",
    avatarProvider: "anam",
    systemPrompt: "You are Kaira, a NULLXES customer support digital employee.",
    temperature: 0.65,
    maxTokens: 8192,
    sessionLimitSeconds: 5400,
    isActive: true,
  });
  console.log("Employee runtime: created");

  await db.insert(employeeProviderConfig).values([
    {
      employeeId: employee.id,
      providerType: "brain",
      providerId: "openai",
      config: {
        model: "gpt-4.1-mini",
        temperature: 0.65,
      },
    },
    {
      employeeId: employee.id,
      providerType: "avatar",
      providerId: "anam",
      config: {
        avatarId: "runtime-engine-anam-avatar",
        quality: "high",
      },
    },
  ]);
  console.log("Provider configs: stored");

  const pendingKnowledge = await createKnowledgeSource({
    employeeId: employee.id,
    type: "text",
    title: "Support Playbook (Pending)",
    chunks: [{ content: "This content should not appear in runtime context." }],
  });

  const readyKnowledge = await createKnowledgeSource({
    employeeId: employee.id,
    type: "text",
    title: "Support Playbook",
    chunks: [
      { content: "Escalate billing issues to the finance queue." },
      { content: "Always confirm the customer organization before changes." },
    ],
  });

  await startKnowledgeProcessing({ sourceId: readyKnowledge.source.id });
  await markKnowledgeReady({ sourceId: readyKnowledge.source.id });

  if (pendingKnowledge.source.status !== "pending") {
    throw new Error("Pending knowledge fixture has unexpected status");
  }
  console.log("Knowledge fixtures: ready and pending sources created");

  const context = await buildEmployeeRuntimeContext({
    employeeId: employee.id,
  });

  if (context.employee.id !== employee.id) {
    throw new Error("Runtime context employee resolution failed");
  }

  if (context.runtime.employeeId !== employee.id) {
    throw new Error("Runtime context runtime resolution failed");
  }
  console.log("Runtime context: employee and runtime loaded");

  if (
    context.brainProvider.providerId !== "openai" ||
    context.brainProvider.config.model !== "gpt-4.1-mini"
  ) {
    throw new Error("Runtime context brain provider config resolution failed");
  }

  if (
    context.avatarProvider.providerId !== "anam" ||
    context.avatarProvider.config.avatarId !== "runtime-engine-anam-avatar"
  ) {
    throw new Error("Runtime context avatar provider config resolution failed");
  }
  console.log("Runtime context: provider configs resolved");

  if (context.limits.sessionLimitSeconds !== 5400) {
    throw new Error("Runtime context session limits were not loaded");
  }

  if (context.limits.maxTokens !== 8192 || !context.limits.isActive) {
    throw new Error("Runtime context limits DTO is incomplete");
  }
  console.log("Runtime context: session limits loaded");

  if (context.knowledge.sources.length !== 1) {
    throw new Error("Runtime context should include only ready knowledge sources");
  }

  if (context.knowledge.sources[0]?.id !== readyKnowledge.source.id) {
    throw new Error("Runtime context knowledge source resolution failed");
  }

  if (context.knowledge.chunks.length !== 2) {
    throw new Error("Runtime context should include ready knowledge chunks only");
  }

  const chunkIndexes = context.knowledge.chunks.map((chunk) => chunk.chunkIndex);
  if (chunkIndexes[0] !== 0 || chunkIndexes[1] !== 1) {
    throw new Error("Runtime context knowledge chunks are not ordered correctly");
  }
  console.log("Runtime context: knowledge resolved");

  if (
    !context.runtime.systemPrompt.includes("Kaira") ||
    context.employee.name !== "Kaira"
  ) {
    throw new Error("Runtime context DTO assembly is incomplete");
  }
  console.log("Runtime context: DTO assembled");

  console.log("Runtime engine verification: OK");
}

verifyRuntimeEngine().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Runtime engine verification failed:", message);
  process.exit(1);
});
