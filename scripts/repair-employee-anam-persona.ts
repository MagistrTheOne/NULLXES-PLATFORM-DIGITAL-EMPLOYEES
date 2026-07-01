import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import {
  ANAM_API_KEY_SLOTS,
  getAnamApiKeyPool,
  type AnamApiKeySlot,
} from "@/shared/config/anam-api-pool";
import { loadEnvFiles } from "@/shared/config/load-env-files";

loadEnvFiles();

const ANAM_API_BASE_URL =
  process.env.ANAM_API_BASE_URL?.trim() || "https://api.anam.ai/v1";

const AVATAR_ONLY_SYSTEM_PROMPT =
  "Avatar-only persona. All conversation logic is handled by the NULLXES client brain.";
const EXTERNAL_LLM_ID = "CUSTOMER_CLIENT_V1";

const employeeId = process.argv[2]?.trim();
const slotArg = process.argv.find((arg) => arg.startsWith("--slot="));
const targetSlot = slotArg?.split("=")[1]?.trim() as AnamApiKeySlot | undefined;

function readMetadata(config: Record<string, unknown>): Record<string, unknown> {
  const metadata = config.providerMetadata;
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : {};
}

async function anamGet(path: string, key: string): Promise<Response> {
  return fetch(`${ANAM_API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
}

async function main(): Promise<void> {
  if (!employeeId || !targetSlot) {
    console.error(
      "Usage: repair-employee-anam-persona <employeeId> --slot=ANAM_API_KEY_2",
    );
    process.exit(1);
  }

  if (!ANAM_API_KEY_SLOTS.includes(targetSlot)) {
    console.error(`Invalid slot ${targetSlot}`);
    process.exit(1);
  }

  const poolEntry = getAnamApiKeyPool().find((entry) => entry.slot === targetSlot);
  if (!poolEntry) {
    console.error(`${targetSlot} is not configured in local env.`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const db = drizzle(neon(databaseUrl));

  const [employee] = await db
    .select({ id: digitalEmployee.id, name: digitalEmployee.name })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    console.error(`No employee ${employeeId}`);
    process.exit(1);
  }

  const rows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const avatarRow = rows.find((row) => row.providerType === "avatar");
  if (!avatarRow) {
    console.error("No avatar provider config");
    process.exit(1);
  }

  const config = avatarRow.config as Record<string, unknown>;
  const metadata = readMetadata(config);
  const avatarId = typeof config.avatarId === "string" ? config.avatarId : null;
  const personaId =
    typeof config.personaId === "string" ? config.personaId : null;
  const voiceId =
    typeof metadata.anamPersonaVoiceId === "string"
      ? metadata.anamPersonaVoiceId
      : null;

  console.log("Current avatar config:", {
    avatarId,
    personaId,
    voiceId,
    slotInMetadata: metadata.anamApiKeySlot ?? null,
    status: config.provisioningStatus ?? null,
    failureReason: config.failureReason ?? null,
  });

  if (!avatarId || !voiceId) {
    console.error("avatarId or anamPersonaVoiceId missing — cannot repair.");
    process.exit(1);
  }

  // 1. Verify the avatar exists on the target slot.
  const avatarCheck = await anamGet(`/avatars/${avatarId}`, poolEntry.key);
  if (!avatarCheck.ok) {
    console.error(
      `Avatar ${avatarId} not found on ${targetSlot} (${avatarCheck.status}). Wrong slot?`,
    );
    process.exit(1);
  }
  console.log(`Avatar exists on ${targetSlot}.`);

  // 2. Reuse the stored persona if it lives on the target slot, else create one.
  let finalPersonaId = personaId;
  if (personaId) {
    const personaCheck = await anamGet(`/personas/${personaId}`, poolEntry.key);
    if (personaCheck.ok) {
      console.log(`Persona ${personaId} exists on ${targetSlot} — reusing.`);
    } else {
      console.log(
        `Persona ${personaId} not on ${targetSlot} (${personaCheck.status}) — creating a new one.`,
      );
      finalPersonaId = null;
    }
  }

  if (!finalPersonaId) {
    const createResponse = await fetch(`${ANAM_API_BASE_URL}/personas`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${poolEntry.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: employee.name,
        description: `${employee.name} NULLXES digital employee persona`,
        avatarId,
        voiceId,
        llmId: EXTERNAL_LLM_ID,
        skipGreeting: true,
        systemPrompt: AVATAR_ONLY_SYSTEM_PROMPT,
      }),
    });

    if (!createResponse.ok) {
      const detail = await createResponse.text();
      console.error(
        `Persona create failed (${createResponse.status}): ${detail.slice(0, 300)}`,
      );
      process.exit(1);
    }

    const created = (await createResponse.json()) as { id?: string };
    if (!created.id) {
      console.error("Persona create returned no id");
      process.exit(1);
    }
    finalPersonaId = created.id;
    console.log(`Created persona ${finalPersonaId} on ${targetSlot}.`);
  }

  // 3. Persist the corrected config.
  await db
    .update(employeeProviderConfig)
    .set({
      config: {
        ...config,
        personaId: finalPersonaId,
        provisioningStatus: "ready",
        failureReason: undefined,
        providerMetadata: {
          ...metadata,
          anamApiKeySlot: targetSlot,
          externalBrainSyncedAt: new Date().toISOString(),
          externalBrainLlmId: EXTERNAL_LLM_ID,
          repairedAt: new Date().toISOString(),
        },
      },
    })
    .where(eq(employeeProviderConfig.id, avatarRow.id));

  console.log("Avatar config repaired:", {
    personaId: finalPersonaId,
    slot: targetSlot,
    status: "ready",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
