import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import {
  ANAM_API_KEY_SLOTS,
  getAnamApiKeyPool,
} from "@/shared/config/anam-api-pool";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const employeeId = process.argv[2];
const repointArg = process.argv.find((arg) => arg.startsWith("--repoint="));
const repointSlot = repointArg?.split("=")[1]?.trim();

function maskKey(value: string): string {
  if (value.length <= 12) {
    return "***";
  }
  return `${value.slice(0, 6)}…${value.slice(-6)}`;
}

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
    console.error("Usage: inspect-employee-anam-key <employeeId> [--repoint=ANAM_API_KEY_2]");
    process.exit(1);
  }

  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    console.log(`No digital employee with id ${employeeId}`);
    return;
  }

  console.log("Employee:", {
    id: employee.id,
    name: employee.name,
    organizationId: employee.organizationId,
    avatarProvider: employee.avatarProvider,
    status: employee.status,
  });

  const configs = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const avatar = configs.find((row) => row.providerType === "avatar");
  if (!avatar) {
    console.log("No avatar provider config for this employee.");
    return;
  }

  const config = avatar.config as Record<string, unknown>;
  const metadata = readMetadata(config);
  const currentSlot =
    typeof metadata.anamApiKeySlot === "string"
      ? metadata.anamApiKeySlot
      : null;

  console.log("Avatar config:", {
    providerId: avatar.providerId,
    personaId: config.personaId ?? null,
    avatarId: config.avatarId ?? null,
    provisioningStatus: config.provisioningStatus ?? null,
    anamApiKeySlot: currentSlot ?? "(none — defaults to first key in pool)",
  });

  const pool = getAnamApiKeyPool();
  console.log(
    "Configured Anam key pool:",
    pool.map((entry) => `${entry.slot} (${entry.label}) ${maskKey(entry.key)}`),
  );

  const effectiveSlot = currentSlot ?? pool[0]?.slot ?? null;
  const effectiveKey = pool.find((entry) => entry.slot === effectiveSlot)?.key;
  console.log(
    "Effective key for this employee:",
    effectiveSlot
      ? `${effectiveSlot} → ${effectiveKey ? maskKey(effectiveKey) : "(slot empty)"}`
      : "(no keys configured)",
  );

  if (!repointSlot) {
    console.log(
      "\nRead-only. To re-point, pass e.g. --repoint=ANAM_API_KEY_2",
    );
    return;
  }

  if (!ANAM_API_KEY_SLOTS.includes(repointSlot as (typeof ANAM_API_KEY_SLOTS)[number])) {
    console.error(`Invalid slot ${repointSlot}. Valid: ${ANAM_API_KEY_SLOTS.join(", ")}`);
    process.exit(1);
  }

  const targetKey = pool.find((entry) => entry.slot === repointSlot)?.key;
  if (!targetKey) {
    console.error(
      `Slot ${repointSlot} is empty in this environment. Set it in .env first.`,
    );
    process.exit(1);
  }

  const nextConfig = {
    ...config,
    providerMetadata: {
      ...metadata,
      anamApiKeySlot: repointSlot,
      repointedAt: new Date().toISOString(),
      repointedFromSlot: currentSlot,
    },
  };

  await db
    .update(employeeProviderConfig)
    .set({ config: nextConfig })
    .where(eq(employeeProviderConfig.id, avatar.id));

  console.log(
    `\nRe-pointed avatar key slot: ${currentSlot ?? "(default)"} → ${repointSlot} (${maskKey(targetKey)})`,
  );
  console.log(
    "NOTE: persona/avatar IDs belong to the original Anam account. If the new key is a different account, re-provision the persona so it exists under the new key.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
