import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { BrainProvider } from "@/entities/digital-employee";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { loadEnvFiles } from "@/shared/config/load-env-files";

loadEnvFiles();

const employeeId = process.argv[2]?.trim();
const provider = (process.argv[3] ?? "openai") as BrainProvider;
const model = process.argv[4] ?? "gpt-4o";
const restoreAvatar = process.argv.includes("--restore-avatar");

async function main(): Promise<void> {
  if (!employeeId) {
    console.error(
      "Usage: set-employee-brain <employeeId> [provider=openai] [model=gpt-4o] [--restore-avatar]",
    );
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const db = drizzle(neon(databaseUrl));

  const [employee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee) {
    console.error(`No digital employee with id ${employeeId}`);
    process.exit(1);
  }

  console.log("Employee:", {
    id: employee.id,
    name: employee.name,
    currentBrainProvider: employee.brainProvider,
  });

  await db
    .update(digitalEmployee)
    .set({ brainProvider: provider })
    .where(eq(digitalEmployee.id, employeeId));

  await db
    .update(employeeRuntime)
    .set({ brainProvider: provider })
    .where(eq(employeeRuntime.employeeId, employeeId));

  const configRows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const brainRow = configRows.find((row) => row.providerType === "brain");
  if (brainRow) {
    const currentConfig = (brainRow.config ?? {}) as Record<string, unknown>;
    const nextConfig: Record<string, unknown> = {
      ...currentConfig,
      model,
      provisioningStatus: "ready",
      failureReason: undefined,
    };
    delete nextConfig.providerResourceId;

    await db
      .update(employeeProviderConfig)
      .set({ providerId: provider, config: nextConfig })
      .where(eq(employeeProviderConfig.id, brainRow.id));

    console.log("Brain config updated:", { provider, model, status: "ready" });
  } else {
    console.warn("No brain provider config row found — skipped config update");
  }

  if (restoreAvatar) {
    const avatarRow = configRows.find((row) => row.providerType === "avatar");
    const avatarConfig = (avatarRow?.config ?? {}) as Record<string, unknown>;

    if (
      avatarRow &&
      avatarConfig.provisioningStatus === "failed" &&
      avatarConfig.personaId &&
      avatarConfig.avatarId
    ) {
      await db
        .update(employeeProviderConfig)
        .set({
          config: {
            ...avatarConfig,
            provisioningStatus: "ready",
            failureReason: undefined,
          },
        })
        .where(eq(employeeProviderConfig.id, avatarRow.id));

      console.log("Avatar config restored to ready:", {
        personaId: avatarConfig.personaId,
        avatarId: avatarConfig.avatarId,
      });
    } else {
      console.log("Avatar restore skipped:", {
        status: avatarConfig.provisioningStatus ?? null,
        personaId: avatarConfig.personaId ?? null,
        avatarId: avatarConfig.avatarId ?? null,
      });
    }
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
