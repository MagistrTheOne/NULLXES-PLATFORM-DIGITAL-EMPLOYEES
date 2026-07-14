import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { digitalEmployee } from "../src/entities/digital-employee/schema";
import { employeeProviderConfig } from "../src/entities/provider-config/schema";
import { loadEnvFiles } from "../src/shared/config/load-env-files";

loadEnvFiles();

const EMPLOYEE_ID = "8f418ec3-286e-4bac-87e0-351783bec70e";
const SLOT = "ANAM_API_KEY_7";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));

  const [employee] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      status: digitalEmployee.status,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, EMPLOYEE_ID))
    .limit(1);

  if (!employee) {
    throw new Error(`Employee not found: ${EMPLOYEE_ID}`);
  }

  const rows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, EMPLOYEE_ID));

  const avatar = rows.find((row) => row.providerType === "avatar");
  if (!avatar) {
    throw new Error("No avatar provider config");
  }

  const config = avatar.config as Record<string, unknown>;
  const metadata =
    config.providerMetadata && typeof config.providerMetadata === "object"
      ? (config.providerMetadata as Record<string, unknown>)
      : {};

  const previousSlot =
    typeof metadata.anamApiKeySlot === "string" ? metadata.anamApiKeySlot : null;

  console.log("Before:", {
    name: employee.name,
    status: employee.status,
    provisioningStatus: config.provisioningStatus ?? null,
    personaId: config.personaId ?? null,
    avatarId: config.avatarId ?? null,
    imageUrl: typeof config.imageUrl === "string" ? "(set)" : null,
    previousSlot,
  });

  const nextConfig = {
    ...config,
    personaId: undefined,
    avatarId: undefined,
    previewUrl: undefined,
    failureReason: undefined,
    provisioningStatus: "pending",
    providerMetadata: {
      ...metadata,
      anamApiKeySlot: SLOT,
      repointedAt: new Date().toISOString(),
      repointedFromSlot: previousSlot,
      repointReason: "anna_lab7_cara4",
    },
  };

  await db
    .update(employeeProviderConfig)
    .set({ config: nextConfig })
    .where(eq(employeeProviderConfig.id, avatar.id));

  const session = rows.find((row) => row.providerType === "session");
  if (session) {
    const sessionConfig = session.config as Record<string, unknown>;
    if (
      sessionConfig.provisioningStatus === "failed" ||
      sessionConfig.provisioningStatus === "pending"
    ) {
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

  console.log("Pinned:", {
    employeeId: EMPLOYEE_ID,
    name: employee.name,
    slot: SLOT,
    label: "lab-7",
    avatarStatus: "pending",
    hasImageUrl: typeof config.imageUrl === "string",
  });
  console.log(
    "Next: run provision on server with ANAM_API_KEY_7 (Vercel). Local KEY_7 is a placeholder.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
