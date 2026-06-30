import type { BrainProvider } from "@/entities/digital-employee";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import { resolveOrganizationProviderKey } from "@/features/provider-credentials";
import {
  getOpenAiApiBaseUrl,
  getNullxesBrainApiBaseUrl,
  getNullxesBrainApiKey,
  nullxesBrainSupportsTools,
  resolveNullxesBrainModel,
} from "@/shared/config/provider-env";

export type BrainApiConfig = {
  provider: BrainProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  supportsTools: boolean;
};

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
    const baseUrl = getNullxesBrainApiBaseUrl();
    const apiKey = getNullxesBrainApiKey();

    if (!baseUrl || !apiKey) {
      throw new Error(
        "NULLXES_BRAIN_API_BASE_URL is not configured (RunPod vLLM endpoint)",
      );
    }

    return {
      provider: "nullxes",
      baseUrl: baseUrl.replace(/\/$/, ""),
      apiKey,
      model: resolveNullxesBrainModel(curatedModel),
      supportsTools: nullxesBrainSupportsTools(),
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
    provider: input.provider,
    baseUrl: getOpenAiApiBaseUrl().replace(/\/$/, ""),
    apiKey,
    model: curatedModel,
    supportsTools: true,
  };
}
