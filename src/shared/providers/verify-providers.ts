import {
  getAvatarProviderMetadata,
  listAvatarProviders,
  registerAvatarProvider,
  resolveAvatarProvider,
} from "./avatar/registry";
import {
  getBrainProviderMetadata,
  listBrainProviders,
  registerBrainProvider,
  resolveBrainProvider,
} from "./brain/registry";
import {
  mockAvatarProvider,
  mockBrainProvider,
  mockSessionProvider,
} from "./mocks";
import {
  getSessionProviderMetadata,
  listSessionProviders,
  registerSessionProvider,
  resolveSessionProvider,
} from "./session/registry";

function assertProviderContract(
  label: string,
  methods: string[],
  provider: object,
): void {
  for (const method of methods) {
    if (typeof (provider as Record<string, unknown>)[method] !== "function") {
      throw new Error(`${label} is missing method: ${method}`);
    }
  }
}

async function verifyProviders(): Promise<void> {
  registerAvatarProvider(
    {
      id: "nullxes",
      name: "NULLXES Avatar",
      description: "Mock avatar provider for verification",
    },
    mockAvatarProvider,
  );

  registerBrainProvider(
    {
      id: "nullxes",
      name: "NULLXES Brain",
      description: "Mock brain provider for verification",
    },
    mockBrainProvider,
  );

  registerSessionProvider(
    {
      id: "nullxes",
      name: "NULLXES Session",
      description: "Mock session provider for verification",
    },
    mockSessionProvider,
  );

  console.log("Providers: registered");

  const avatar = resolveAvatarProvider("nullxes");
  const brain = resolveBrainProvider("nullxes");
  const session = resolveSessionProvider("nullxes");

  assertProviderContract("AvatarProvider", [
    "createAvatar",
    "updateAvatar",
    "deleteAvatar",
    "healthCheck",
  ], avatar);
  assertProviderContract("BrainProvider", ["generateResponse", "healthCheck"], brain);
  assertProviderContract("SessionProvider", [
    "createSession",
    "terminateSession",
    "healthCheck",
  ], session);
  console.log("Provider contracts: valid");

  const avatarHealth = await avatar.healthCheck();
  const brainHealth = await brain.healthCheck();
  const sessionHealth = await session.healthCheck();

  if (!avatarHealth.healthy || !brainHealth.healthy || !sessionHealth.healthy) {
    throw new Error("Provider health checks failed");
  }
  console.log("Provider health checks: OK");

  const avatarMeta = getAvatarProviderMetadata("nullxes");
  const brainMeta = getBrainProviderMetadata("nullxes");
  const sessionMeta = getSessionProviderMetadata("nullxes");

  if (
    listAvatarProviders().length !== 1 ||
    listBrainProviders().length !== 1 ||
    listSessionProviders().length !== 1
  ) {
    throw new Error("Provider registry listing failed");
  }

  if (avatarMeta.id !== "nullxes" || brainMeta.id !== "nullxes" || sessionMeta.id !== "nullxes") {
    throw new Error("Provider metadata lookup failed");
  }
  console.log("Provider metadata: resolved");

  const brainResponse = await brain.generateResponse({
    employeeId: "employee-verify",
    prompt: "ping",
  });
  if (!brainResponse.text.startsWith("mock-response:")) {
    throw new Error("Brain provider mock response failed");
  }
  console.log("Provider resolution: OK");

  try {
    resolveAvatarProvider("anam");
    throw new Error("Unregistered provider should not resolve");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Unregistered provider should not resolve")) {
      throw error;
    }
    console.log("Provider lookup guard: enforced");
  }

  console.log("Provider abstraction verification: OK");
}

verifyProviders().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Provider verification failed:", message);
  process.exit(1);
});
