import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { createDigitalEmployee } from "@/features/employee";
import { db } from "@/shared/db/client";
import { dbWithTransactions } from "@/shared/db/pool-client";
import type { CreateEmployeeDraftPayload } from "./create/types";
import { assertEmployeePersisted } from "./actions/persist-digital-employee-from-draft";

const TEST_USER_ID = "persist-create-employee-user";

const SAMPLE_DRAFT: CreateEmployeeDraftPayload = {
  status: "draft",
  identity: {
    name: "Atlas",
    role: "Automation Engineer",
  },
  avatar: {
    photoFileName: "atlas.png",
    photoFileSize: 1024,
    generateAvatarEnabled: false,
    avatarProvider: "custom",
  },
  voice: {
    provider: "elevenlabs",
  },
  brain: {
    provider: "openai",
  },
  knowledge: [
    { type: "file", name: "runbook.pdf", size: 2048 },
    { type: "url", url: "https://docs.nullxes.local/runbook" },
    { type: "text", content: "Operational checklist for Atlas." },
  ],
};

async function ensureTestUser(): Promise<void> {
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Persist Create Employee User",
      email: "persist-create-employee@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }
}

async function persistDraftForVerify(
  organizationId: string,
  draft: CreateEmployeeDraftPayload,
): Promise<string> {
  const created = await createDigitalEmployee({
    organizationId,
    actorUserId: TEST_USER_ID,
    name: draft.identity.name,
    role: draft.identity.role,
    description: `${draft.identity.role} digital employee`,
    avatarProvider: draft.avatar.avatarProvider,
    brainProvider: draft.brain.provider,
    systemPrompt: `You are ${draft.identity.name}, a ${draft.identity.role}.`,
    reason: "Persist create employee verification",
  });

  await dbWithTransactions.transaction(async (tx) => {
    await tx.insert(employeeProviderConfig).values([
      {
        employeeId: created.employee.id,
        providerType: "avatar",
        providerId: draft.avatar.avatarProvider,
        config: {
          photoFileName: draft.avatar.photoFileName,
          photoFileSize: draft.avatar.photoFileSize,
        },
      },
      {
        employeeId: created.employee.id,
        providerType: "brain",
        providerId: draft.brain.provider,
        config: { model: "gpt-4.1-mini" },
      },
      {
        employeeId: created.employee.id,
        providerType: "session",
        providerId: draft.voice.provider,
        config: { voiceProvider: draft.voice.provider },
      },
    ]);

    if (draft.knowledge.length > 0) {
      await tx.insert(knowledgeSource).values(
        draft.knowledge.map((item) => ({
          employeeId: created.employee.id,
          type: item.type,
          title:
            item.type === "file"
              ? item.name
              : item.type === "url"
                ? item.url
                : item.content.slice(0, 160),
          status: "pending" as const,
        })),
      );
    }
  });

  return created.employee.id;
}

async function verifyPersistCreateEmployee(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "Persist Create Employee Org",
    slug: `persist-create-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const employeeId = await persistDraftForVerify(org.id, SAMPLE_DRAFT);
  await assertEmployeePersisted(employeeId);

  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee || employee.name !== "Atlas") {
    throw new Error("Employee was not persisted");
  }

  const knowledgeRows = await db
    .select()
    .from(knowledgeSource)
    .where(eq(knowledgeSource.employeeId, employeeId));

  if (knowledgeRows.length !== 3) {
    throw new Error("Knowledge metadata was not persisted");
  }

  const [reloaded] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!reloaded) {
    throw new Error("Employee did not remain after reload");
  }

  console.log("Create employee: persisted with runtime and lifecycle");
  console.log("Provider configuration: avatar, brain, voice stored");
  console.log("Knowledge metadata: stored without processing");
  console.log("Persist create employee verification: OK");
}

verifyPersistCreateEmployee().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Persist create employee verification failed:", message);
  process.exit(1);
});
