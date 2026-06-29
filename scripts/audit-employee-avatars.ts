import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { getAnamApiKeyPool } from "@/shared/config/anam-api-pool";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

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
  const pool = getAnamApiKeyPool();
  const configuredSlots = new Set<string>(pool.map((entry) => entry.slot));
  console.log(
    "Configured Anam slots in this env:",
    pool.length ? pool.map((e) => e.slot).join(", ") : "(none)",
  );
  console.log("");

  const employees = await db
    .select()
    .from(digitalEmployee)
    .orderBy(digitalEmployee.createdAt);

  const avatarConfigs = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.providerType, "avatar"));

  const byEmployee = new Map(avatarConfigs.map((row) => [row.employeeId, row]));

  const slotCounts = new Map<string, number>();

  for (const employee of employees) {
    const avatar = byEmployee.get(employee.id);
    const config = (avatar?.config ?? {}) as Record<string, unknown>;
    const metadata = readMetadata(config);
    const slot =
      typeof metadata.anamApiKeySlot === "string"
        ? metadata.anamApiKeySlot
        : "(default → first slot)";
    const status = (config.provisioningStatus as string) ?? "(none)";

    slotCounts.set(slot, (slotCounts.get(slot) ?? 0) + 1);

    const slotWarning =
      typeof metadata.anamApiKeySlot === "string" &&
      !configuredSlots.has(metadata.anamApiKeySlot)
        ? "  ⚠ SLOT NOT CONFIGURED IN THIS ENV"
        : "";

    console.log(
      [
        `• ${employee.name}  [${employee.status}]`,
        `    id:        ${employee.id}`,
        `    org:       ${employee.organizationId}`,
        `    avatarPrv: ${employee.avatarProvider}`,
        `    status:    ${status}`,
        `    slot:      ${slot}${slotWarning}`,
        `    personaId: ${config.personaId ?? "null"}`,
        `    avatarId:  ${config.avatarId ?? "null"}`,
        config.failureReason ? `    failure:   ${config.failureReason}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  console.log("\n=== Summary by key slot ===");
  for (const [slot, count] of [...slotCounts.entries()].sort()) {
    console.log(`  ${slot}: ${count}`);
  }
  console.log(`  Total employees: ${employees.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
