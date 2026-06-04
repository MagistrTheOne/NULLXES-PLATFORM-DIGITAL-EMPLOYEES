import { loadEnvFiles } from "@/shared/config/load-env-files";

loadEnvFiles();

async function verifyProviderProvisioning(): Promise<void> {
  const { eq } = await import("drizzle-orm");
  const { employeeProviderConfig } = await import(
    "@/entities/provider-config/schema"
  );
  const { digitalEmployee } = await import(
    "@/entities/digital-employee/schema"
  );
  const { createOrganization } = await import(
    "@/entities/organization/create-organization"
  );
  const { user } = await import("@/entities/user/schema");
  const { createDigitalEmployee } = await import("@/features/employee");
  const {
    hasAnamCredentials,
    hasElevenLabsCredentials,
    hasOpenAiCredentials,
  } = await import("@/shared/config/provider-env");
  const { db } = await import("@/shared/db/client");
  const { ELEVENLABS_VOICE_MODEL_ID } = await import("./types");
  const { provisionEmployeeProviders } = await import(
    "./services/provision-employee-providers"
  );
  type BrainProviderConfigPayload = import("@/entities/provider-config").BrainProviderConfigPayload;
  type AvatarProviderConfigPayload =
    import("@/entities/provider-config").AvatarProviderConfigPayload;
  type SessionProviderConfigPayload =
    import("@/entities/provider-config").SessionProviderConfigPayload;

  if (!hasOpenAiCredentials()) {
    throw new Error("OPENAI_API_KEY is required for provider provisioning verify");
  }

  if (!hasAnamCredentials()) {
    throw new Error("ANAM_API_KEY is required for provider provisioning verify");
  }

  if (!hasElevenLabsCredentials()) {
    throw new Error(
      "ELEVENLABS_API_KEY is required for provider provisioning verify",
    );
  }

  const verifyUserId = "provider-provisioning-verify-user";
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.id, verifyUserId))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(user).values({
      id: verifyUserId,
      name: "Provider Provisioning Verify User",
      email: "provider-provisioning@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }

  const org = await createOrganization({
    name: "NULLXES Provider Provisioning Verify Org",
    slug: `provider-provisioning-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const created = await createDigitalEmployee({
    organizationId: org.id,
    actorUserId: verifyUserId,
    name: "Kaira",
    role: "Customer Support Employee",
    description: "Provider provisioning verification employee",
    avatarProvider: "anam",
    brainProvider: "openai",
    systemPrompt:
      "You are Kaira, a NULLXES customer support digital employee.",
    reason: "Provider provisioning verification",
  });

  const employeeId = created.employee.id;
  console.log("Digital employee: created");

  await db.insert(employeeProviderConfig).values([
    {
      employeeId,
      providerType: "avatar",
      providerId: "anam",
      config: {
        displayName: "Kaira",
        provisioningStatus: "pending",
      },
    },
    {
      employeeId,
      providerType: "brain",
      providerId: "openai",
      config: {
        model: "gpt-4.1-mini",
        temperature: 0.7,
        provisioningStatus: "pending",
      },
    },
    {
      employeeId,
      providerType: "session",
      providerId: "elevenlabs",
      config: {
        voiceProvider: "elevenlabs",
        provisioningStatus: "pending",
      },
    },
  ]);
  console.log("Provider configuration: pending");

  const results = await provisionEmployeeProviders({ employeeId });

  if (results.brain.status !== "ready" || !results.brain.providerResourceId) {
    throw new Error(
      `OpenAI brain provisioning failed: ${results.brain.failureReason ?? "unknown"}`,
    );
  }
  console.log("OpenAI brain: provisioned");

  if (results.avatar.status !== "ready" || !results.avatar.providerResourceId) {
    throw new Error(
      `Anam avatar provisioning failed: ${results.avatar.failureReason ?? "unknown"}`,
    );
  }
  console.log("Anam persona: provisioned");

  if (results.voice.status !== "ready" || !results.voice.providerResourceId) {
    throw new Error(
      `ElevenLabs voice provisioning failed: ${results.voice.failureReason ?? "unknown"}`,
    );
  }
  console.log("ElevenLabs voice: provisioned");

  const rows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const brainRow = rows.find((row) => row.providerType === "brain");
  const avatarRow = rows.find((row) => row.providerType === "avatar");
  const sessionRow = rows.find((row) => row.providerType === "session");

  const brainConfig = brainRow?.config as BrainProviderConfigPayload | undefined;
  const avatarConfig = avatarRow?.config as AvatarProviderConfigPayload | undefined;
  const sessionConfig = sessionRow?.config as
    | SessionProviderConfigPayload
    | undefined;

  if (
    !brainConfig?.providerResourceId ||
    brainConfig.provisioningStatus !== "ready"
  ) {
    throw new Error("OpenAI provider identifiers did not persist");
  }

  if (
    !avatarConfig?.personaId ||
    !avatarConfig.avatarId ||
    avatarConfig.provisioningStatus !== "ready"
  ) {
    throw new Error("Anam provider identifiers did not persist");
  }

  if (
    !sessionConfig?.voiceId ||
    sessionConfig.modelId !== ELEVENLABS_VOICE_MODEL_ID ||
    sessionConfig.provisioningStatus !== "ready"
  ) {
    throw new Error("ElevenLabs provider identifiers did not persist");
  }

  const [reloadedEmployee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!reloadedEmployee) {
    throw new Error("Employee record was removed after provisioning failures");
  }

  console.log("Provider configuration: reloaded with external identifiers");
  console.log("Provider provisioning verification: OK");
}

verifyProviderProvisioning().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Provider provisioning verification failed:", message);
  process.exit(1);
});
