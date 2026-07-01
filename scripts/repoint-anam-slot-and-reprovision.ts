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

const employeeId = process.argv[2]?.trim();
const slotArg = process.argv.find((arg) => arg.startsWith("--slot="));
const slot = (slotArg?.split("=")[1]?.trim() ??
  "ANAM_API_KEY_9") as AnamApiKeySlot;

function readMetadata(config: unknown): Record<string, unknown> {
  if (
    config &&
    typeof config === "object" &&
    "providerMetadata" in config &&
    typeof (config as { providerMetadata?: unknown }).providerMetadata ===
      "object" &&
    (config as { providerMetadata?: unknown }).providerMetadata !== null
  ) {
    return (config as { providerMetadata: Record<string, unknown> })
      .providerMetadata;
  }
  return {};
}

async function main(): Promise<void> {
  if (!employeeId) {
    console.error(
      "Usage: npx tsx scripts/repoint-anam-slot-and-reprovision.ts <employeeId> [--slot=ANAM_API_KEY_9]",
    );
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  if (!ANAM_API_KEY_SLOTS.includes(slot)) {
    console.error(`Invalid slot ${slot}`);
    process.exit(1);
  }

  if (!getAnamApiKeyPool().some((entry) => entry.slot === slot)) {
    console.error(`${slot} is not configured in local env (check Vercel keys).`);
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

  const avatarRows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const avatar = avatarRows.find((row) => row.providerType === "avatar");
  if (!avatar) {
    console.error("No avatar provider config");
    process.exit(1);
  }

  const avatarConfig = avatar.config as Record<string, unknown>;
  const metadata = readMetadata(avatarConfig);
  const previousSlot =
    typeof metadata.anamApiKeySlot === "string" ? metadata.anamApiKeySlot : null;

  const nextAvatarConfig = {
    ...avatarConfig,
    personaId: undefined,
    avatarId: undefined,
    previewUrl: undefined,
    failureReason: undefined,
    provisioningStatus: "pending",
    providerMetadata: {
      ...metadata,
      anamApiKeySlot: slot,
      repointedAt: new Date().toISOString(),
      repointedFromSlot: previousSlot,
      repointReason: "script_slot_pin",
    },
  };

  await db
    .update(employeeProviderConfig)
    .set({ config: nextAvatarConfig })
    .where(eq(employeeProviderConfig.id, avatar.id));

  const session = avatarRows.find((row) => row.providerType === "session");
  if (session) {
    const sessionConfig = session.config as Record<string, unknown>;
    if (sessionConfig.provisioningStatus === "failed") {
      await db
        .update(employeeProviderConfig)
        .set({
          config: {
            ...sessionConfig,
            provisioningStatus: "pending",
            failureReason: undefined,
          },
        })
        .where(eq(employeeProviderConfig.id, session.id));
    }
  }

  console.log("Repointed:", {
    employeeId: employee.id,
    name: employee.name,
    previousSlot: previousSlot ?? "(default lab-1)",
    slot,
    avatarStatus: "pending",
  });
  console.log(
    "\nRe-upload the employee photo (create flow / studio) — upload will use the pinned slot only.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
