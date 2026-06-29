import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { provisionEmployeeProviders } from "@/features/provider-provisioning";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const employeeId = process.argv[2];

async function printAvatarConfig(label: string): Promise<void> {
  const [row] = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId))
    .limit(1);
  // Re-query specifically the avatar row.
  const rows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));
  const avatar = rows.find((r) => r.providerType === "avatar") ?? row;
  const config = (avatar?.config ?? {}) as Record<string, unknown>;
  const metadata =
    (config.providerMetadata as Record<string, unknown> | undefined) ?? {};
  console.log(`${label}:`, {
    provisioningStatus: config.provisioningStatus ?? null,
    personaId: config.personaId ?? null,
    avatarId: config.avatarId ?? null,
    anamApiKeySlot: metadata.anamApiKeySlot ?? null,
    failureReason: config.failureReason ?? null,
  });
}

async function main(): Promise<void> {
  if (!employeeId) {
    console.error("Usage: provision-employee <employeeId>");
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

  console.log("Provisioning employee:", {
    id: employee.id,
    name: employee.name,
    status: employee.status,
  });

  await printAvatarConfig("Before");

  const result = await provisionEmployeeProviders({ employeeId });

  console.log("Provisioning result:", {
    brain: { status: result.brain.status, reason: result.brain.failureReason },
    avatar: {
      status: result.avatar.status,
      resourceId: result.avatar.providerResourceId,
      reason: result.avatar.failureReason,
    },
    voice: { status: result.voice.status, reason: result.voice.failureReason },
  });

  await printAvatarConfig("After");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
