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
    avatarId: "studio-atlas-avatar-001",
    previewUrl: "https://cdn.nullxes.local/atlas.png",
    personaId: "studio-atlas-persona-001",
    provider: "anam",
    photoFileName: "atlas.png",
    photoFileSize: 1024,
    generateAvatarEnabled: true,
    anamPersonaVoiceId: "de23e340-1416-4dd8-977d-065a7ca11697",
    voiceBinding: "elevenlabs_shell",
  },
  voice: {
    studioVoiceId: "elevenlabs-george",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    provider: "elevenlabs",
    model: "eleven_v3",
  },
  brain: {
    provider: "openai",
  },
  knowledge: [
    { type: "file", name: "runbook.txt", size: 2048, content: "Operational runbook excerpt." },
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
    avatarProvider: draft.avatar.provider,
    brainProvider: draft.brain.provider,
    systemPrompt: `You are ${draft.identity.name}, a ${draft.identity.role}.`,
    reason: "Persist create employee verification",
  });

  await dbWithTransactions.transaction(async (tx) => {
    await tx.insert(employeeProviderConfig).values([
      {
        employeeId: created.employee.id,
        providerType: "avatar",
        providerId: draft.avatar.provider,
        config: {
          avatarId: draft.avatar.avatarId,
          personaId: draft.avatar.personaId,
          previewUrl: draft.avatar.previewUrl,
          provisioningStatus: "ready",
          providerMetadata: {
            source: "studio",
            voiceBinding: draft.avatar.voiceBinding,
            anamPersonaVoiceId: draft.avatar.anamPersonaVoiceId,
          },
        },
      },
      {
        employeeId: created.employee.id,
        providerType: "brain",
        providerId: draft.brain.provider,
        config: { model: "gpt-4.1-mini", provisioningStatus: "pending" },
      },
      {
        employeeId: created.employee.id,
        providerType: "session",
        providerId: draft.voice.provider,
        config: {
          voiceProvider: draft.voice.provider,
          voiceId: draft.voice.voiceId,
          modelId: draft.voice.model,
          studioVoiceId: draft.voice.studioVoiceId,
          provisioningStatus: "ready",
        },
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

  const configs = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const avatarConfig = configs.find((row) => row.providerType === "avatar");
  const sessionConfig = configs.find((row) => row.providerType === "session");

  const avatarPayload = avatarConfig?.config as {
    personaId?: string;
    voiceBinding?: string;
  };
  const sessionPayload = sessionConfig?.config as {
    voiceId?: string;
    studioVoiceId?: string;
  };

  if (avatarPayload?.personaId !== SAMPLE_DRAFT.avatar.personaId) {
    throw new Error("Studio personaId was not persisted");
  }

  if (sessionPayload?.studioVoiceId !== SAMPLE_DRAFT.voice.studioVoiceId) {
    throw new Error("Studio voice selection was not persisted");
  }

  console.log("Persist create employee verification: OK");
}

verifyPersistCreateEmployee().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Persist create employee verification failed:", message);
  process.exit(1);
});
