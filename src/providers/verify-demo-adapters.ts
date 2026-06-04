import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { employeeRuntime } from "@/entities/runtime/schema";
import {
  getAvatarProviderMetadata,
  getBrainProviderMetadata,
  resolveAvatarProvider,
  resolveBrainProvider,
} from "@/shared/providers";
import {
  hasAnamCredentials,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";
import { db } from "@/shared/db/client";
import { loadEmployeeProviderConfigs } from "./load-employee-provider-configs";
import { registerDemoProviderAdapters } from "./register-demo-adapters";

async function verifyDemoAdapters(): Promise<void> {
  const org = await createOrganization({
    name: "NULLXES Demo Adapters Verify Org",
    slug: `demo-adapters-verify-${Date.now()}`,
    type: "demo",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Megan",
      description: "Demo adapter verification employee",
      role: "Legal Operations Employee",
      status: "active",
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
    systemPrompt: "You are Megan, a NULLXES legal operations digital employee.",
    temperature: 0.6,
    maxTokens: 4096,
    sessionLimitSeconds: 3600,
    isActive: true,
  });
  console.log("Employee runtime: linked");

  await db.insert(employeeProviderConfig).values([
    {
      employeeId: employee.id,
      providerType: "brain",
      providerId: "openai",
      config: {
        model: "gpt-4.1-mini",
        temperature: 0.7,
      },
    },
    {
      employeeId: employee.id,
      providerType: "avatar",
      providerId: "anam",
      config: {
        avatarId: "demo-anam-avatar-001",
        quality: "high",
      },
    },
  ]);
  console.log("Provider config: stored");

  const configs = await loadEmployeeProviderConfigs(employee.id);

  if (configs.brain.providerId !== "openai" || configs.brain.config.model !== "gpt-4.1-mini") {
    throw new Error("OpenAI provider config was not loaded correctly");
  }

  if (
    configs.avatar.providerId !== "anam" ||
    configs.avatar.config.avatarId !== "demo-anam-avatar-001"
  ) {
    throw new Error("Anam provider config was not loaded correctly");
  }
  console.log("Provider config: loaded");

  registerDemoProviderAdapters(configs);
  console.log("Demo adapters: registered");

  const brain = resolveBrainProvider("openai");
  const avatar = resolveAvatarProvider("anam");

  const brainMeta = getBrainProviderMetadata("openai");
  const avatarMeta = getAvatarProviderMetadata("anam");

  if (brainMeta.id !== "openai" || avatarMeta.id !== "anam") {
    throw new Error("Provider metadata resolution failed");
  }
  console.log("Provider registry: resolved");

  const brainHealth = await brain.healthCheck();
  const avatarHealth = await avatar.healthCheck();

  if (brainHealth.providerId !== "openai" || avatarHealth.providerId !== "anam") {
    throw new Error("Provider health check returned invalid provider id");
  }

  if (brainHealth.healthy) {
    console.log("OpenAI health check: OK");
  } else if (hasOpenAiCredentials()) {
    console.log("OpenAI health check: remote unavailable (registry and config valid)");
  } else {
    console.log("OpenAI health check: config-only (no API key in environment)");
  }

  if (avatarHealth.healthy) {
    console.log("Anam health check: OK");
  } else if (hasAnamCredentials()) {
    console.log("Anam health check: remote unavailable (registry and config valid)");
  } else {
    console.log("Anam health check: config-only (no API key in environment)");
  }

  const storedConfigs = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employee.id));

  if (storedConfigs.length !== 2) {
    throw new Error("Provider config persistence verification failed");
  }

  console.log("Demo provider adapters verification: OK");
}

verifyDemoAdapters().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Demo provider adapters verification failed:", message);
  process.exit(1);
});
