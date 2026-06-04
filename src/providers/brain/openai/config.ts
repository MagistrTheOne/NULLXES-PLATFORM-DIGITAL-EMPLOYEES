import type { BrainProviderConfigPayload } from "@/entities/provider-config";

export type OpenAiBrainAdapterConfig = BrainProviderConfigPayload & {
  systemPrompt?: string;
};

export const OPENAI_BRAIN_PROVIDER_ID = "openai" as const;
