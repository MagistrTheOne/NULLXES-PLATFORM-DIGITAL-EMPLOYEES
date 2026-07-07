import type { BrainProvider } from "@/entities/digital-employee";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import { resolveOrganizationProviderKey } from "@/features/provider-credentials";
import {
  getOpenAiApiBaseUrl,
  resolveNullxesBrainModel,
} from "@/shared/config/provider-env";
import {
  getNullxesApiDefaultModel,
  resolveNullxesSdkConfig,
} from "@/shared/nullxes-sdk";

export type BrainTransportKind =
  | "openai-compatible"
  | "anthropic"
  | "google";

export type BrainApiConfig = {
  provider: BrainProvider;
  transport: BrainTransportKind;
  baseUrl: string;
  apiKey: string;
  model: string;
  supportsTools: boolean;
};

function nullxesSupportsTools(): boolean {
  return process.env.NULLXES_BRAIN_SUPPORTS_TOOLS?.trim() === "true";
}

export async function resolveBrainApiConfig(input: {
  provider: BrainProvider;
  configuredModel?: string | null;
  organizationId?: string;
}): Promise<BrainApiConfig> {
  const curatedModel = resolveBrainModelForProvider(
    input.provider,
    input.configuredModel,
  );

  if (input.provider === "nullxes") {
    const sdkConfig = resolveNullxesSdkConfig();
    if (!sdkConfig) {
      throw new Error(
        "NULLXES API is not configured. Set NULLXES_API_BASE_URL and NULLXES_API_KEY.",
      );
    }

    const model =
      curatedModel === "nullxes-brain-v1"
        ? sdkConfig.defaultModel || getNullxesApiDefaultModel()
        : resolveNullxesBrainModel(curatedModel);

    return {
      provider: "nullxes",
      transport: "openai-compatible",
      baseUrl: sdkConfig.baseUrl,
      apiKey: sdkConfig.apiKey,
      model,
      supportsTools: nullxesSupportsTools(),
    };
  }

  if (input.provider === "anthropic") {
    const apiKey = await resolveOrganizationProviderKey(
      input.organizationId,
      "anthropic",
    );
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    return {
      provider: "anthropic",
      transport: "anthropic",
      baseUrl: "https://api.anthropic.com",
      apiKey,
      model: curatedModel,
      supportsTools: true,
    };
  }

  if (input.provider === "google") {
    const apiKey = await resolveOrganizationProviderKey(
      input.organizationId,
      "google",
    );
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    return {
      provider: "google",
      transport: "google",
      baseUrl: "https://generativelanguage.googleapis.com",
      apiKey,
      model: curatedModel,
      supportsTools: false,
    };
  }

  const apiKey = await resolveOrganizationProviderKey(
    input.organizationId,
    "openai",
  );
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return {
    provider: "openai",
    transport: "openai-compatible",
    baseUrl: getOpenAiApiBaseUrl().replace(/\/$/, ""),
    apiKey,
    model: curatedModel,
    supportsTools: true,
  };
}
