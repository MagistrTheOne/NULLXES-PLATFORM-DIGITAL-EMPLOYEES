import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { employeeRuntime } from "@/entities/runtime/schema";
import { db } from "@/shared/db/client";
import { employeeProviderConfig } from "./schema";

const AVATAR_CONFIG_V1 = {
  avatarId: "avatar-verify-001",
  quality: "high",
} as const;

const AVATAR_CONFIG_V2 = {
  avatarId: "avatar-verify-002",
  quality: "standard",
} as const;

const BRAIN_CONFIG = {
  model: "gpt-4.1-mini",
  temperature: 0.7,
} as const;

async function verifyProviderConfig(): Promise<void> {
  await db.select().from(employeeProviderConfig).limit(1);
  console.log("employee_provider_config table: accessible");

  const org = await createOrganization({
    name: "NULLXES Provider Config Verify Org",
    slug: `provider-config-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Somnia",
      description: "Provider config verify fixture employee",
      role: "Enterprise Sales Employee",
      status: "draft",
      avatarProvider: "anam",
      brainProvider: "openai",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee");
  }
  console.log("Digital employee: created");

  await db.insert(employeeRuntime).values({
    employeeId: employee.id,
    brainProvider: "openai",
    avatarProvider: "anam",
    systemPrompt: "You are Somnia, a NULLXES enterprise sales employee.",
    temperature: 0.7,
    maxTokens: 4096,
    sessionLimitSeconds: 3600,
    isActive: true,
  });
  console.log("Employee runtime: linked (storage only, no SDK)");

  const [avatarConfig] = await db
    .insert(employeeProviderConfig)
    .values({
      employeeId: employee.id,
      providerType: "avatar",
      providerId: "anam",
      config: { ...AVATAR_CONFIG_V1 },
    })
    .returning();

  if (!avatarConfig) {
    throw new Error("Failed to create avatar provider config");
  }
  console.log("Avatar provider config: created");

  const [brainConfig] = await db
    .insert(employeeProviderConfig)
    .values({
      employeeId: employee.id,
      providerType: "brain",
      providerId: "openai",
      config: { ...BRAIN_CONFIG },
    })
    .returning();

  if (!brainConfig) {
    throw new Error("Failed to create brain provider config");
  }
  console.log("Brain provider config: created");

  const employeeWithConfigs = await db.query.digitalEmployee.findFirst({
    where: eq(digitalEmployee.id, employee.id),
    with: { providerConfigs: true },
  });

  if (
    !employeeWithConfigs?.providerConfigs ||
    employeeWithConfigs.providerConfigs.length !== 2
  ) {
    throw new Error("Digital employee provider config relation is invalid");
  }
  console.log("Provider config relation: valid (1:N)");

  const retrievedAvatar = await db.query.employeeProviderConfig.findFirst({
    where: and(
      eq(employeeProviderConfig.employeeId, employee.id),
      eq(employeeProviderConfig.providerType, "avatar"),
    ),
    with: { employee: true },
  });

  if (
    !retrievedAvatar?.employee ||
    retrievedAvatar.employee.id !== employee.id ||
    retrievedAvatar.providerId !== "anam" ||
    retrievedAvatar.config.avatarId !== AVATAR_CONFIG_V1.avatarId
  ) {
    throw new Error("Avatar provider config retrieval failed");
  }
  console.log("Avatar provider config retrieval: valid");

  const [replacedAvatar] = await db
    .update(employeeProviderConfig)
    .set({
      providerId: "anam",
      config: { ...AVATAR_CONFIG_V2 },
    })
    .where(eq(employeeProviderConfig.id, avatarConfig.id))
    .returning();

  if (
    !replacedAvatar ||
    replacedAvatar.config.avatarId !== AVATAR_CONFIG_V2.avatarId
  ) {
    throw new Error("Avatar provider config was not replaceable");
  }
  console.log("Provider configuration: replaceable");

  const retrievedBrain = await db.query.employeeProviderConfig.findFirst({
    where: eq(employeeProviderConfig.id, brainConfig.id),
  });

  if (
    !retrievedBrain ||
    retrievedBrain.config.model !== BRAIN_CONFIG.model ||
    retrievedBrain.providerType !== "brain"
  ) {
    throw new Error("Brain provider config retrieval failed");
  }
  console.log("Brain provider config retrieval: valid");

  console.log("Provider config verification: OK");
}

verifyProviderConfig().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Provider config verification failed:", message);
  process.exit(1);
});
