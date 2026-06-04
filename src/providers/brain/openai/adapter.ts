import type { BrainProvider } from "@/shared/providers/brain/interfaces";
import type {
  GenerateResponseInput,
  GenerateResponseResult,
  HealthCheckResult,
} from "@/shared/providers/brain/types";
import {
  getOpenAiApiBaseUrl,
  getOpenAiApiKey,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";
import type { OpenAiBrainAdapterConfig } from "./config";
import { OPENAI_BRAIN_PROVIDER_ID } from "./config";

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export function createOpenAiBrainAdapter(
  config: OpenAiBrainAdapterConfig,
): BrainProvider {
  return {
    async generateResponse(
      input: GenerateResponseInput,
    ): Promise<GenerateResponseResult> {
      const apiKey = getOpenAiApiKey();
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const response = await fetch(`${getOpenAiApiBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          temperature: config.temperature ?? 0.7,
          messages: [
            ...(config.systemPrompt
              ? [{ role: "system", content: config.systemPrompt }]
              : []),
            ...(input.systemPrompt
              ? [{ role: "system", content: input.systemPrompt }]
              : []),
            { role: "user", content: input.prompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI generateResponse failed with status ${response.status}`,
        );
      }

      const payload = (await response.json()) as OpenAiChatCompletionResponse;
      const text = payload.choices?.[0]?.message?.content?.trim();

      if (!text) {
        throw new Error("OpenAI generateResponse returned an empty response");
      }

      return {
        text,
        providerId: OPENAI_BRAIN_PROVIDER_ID,
      };
    },

    async healthCheck(): Promise<HealthCheckResult> {
      if (!hasOpenAiCredentials()) {
        return {
          healthy: Boolean(config.model),
          providerId: OPENAI_BRAIN_PROVIDER_ID,
        };
      }

      try {
        const apiKey = getOpenAiApiKey();
        const response = await fetch(`${getOpenAiApiBaseUrl()}/models`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        return {
          healthy: response.ok,
          providerId: OPENAI_BRAIN_PROVIDER_ID,
        };
      } catch {
        return {
          healthy: false,
          providerId: OPENAI_BRAIN_PROVIDER_ID,
        };
      }
    },
  };
}
