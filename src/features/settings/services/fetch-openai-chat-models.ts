import {
  getOpenAiApiBaseUrl,
  getOpenAiApiKey,
} from "@/shared/config/provider-env";
import {
  compareOpenAiModelIds,
  formatOpenAiModelPricing,
  resolveOpenAiModelPricing,
} from "../lib/openai-model-pricing";

type OpenAiModelsResponse = {
  data?: Array<{
    id: string;
    owned_by?: string;
  }>;
};

export type OpenAiBrainModelOption = {
  id: string;
  pricingLabel: string | null;
};

const EXCLUDED_MODEL_PATTERNS = [
  /embed/i,
  /whisper/i,
  /tts/i,
  /dall-e/i,
  /moderation/i,
  /transcri/i,
  /realtime/i,
  /audio/i,
  /search/i,
  /computer-use/i,
  /deep-research/i,
  /instruct/i,
  /davinci/i,
  /babbage/i,
  /codex/i,
  /sora/i,
];

function isChatCompletionModel(modelId: string): boolean {
  if (EXCLUDED_MODEL_PATTERNS.some((pattern) => pattern.test(modelId))) {
    return false;
  }

  return /^(gpt-[0-9]|gpt-4|gpt-3\.5|o[0-9]|chatgpt)/i.test(modelId);
}

export async function fetchOpenAiChatModels(): Promise<
  | { ok: true; models: OpenAiBrainModelOption[] }
  | { ok: false; message: string }
> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    return { ok: false, message: "OPENAI_API_KEY is not configured." };
  }

  const response = await fetch(`${getOpenAiApiBaseUrl()}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return {
      ok: false,
      message: `OpenAI models request failed (${response.status}).`,
    };
  }

  const payload = (await response.json()) as OpenAiModelsResponse;
  const models = (payload.data ?? [])
    .map((model) => model.id)
    .filter(isChatCompletionModel)
    .sort(compareOpenAiModelIds)
    .map((id) => ({
      id,
      pricingLabel: formatOpenAiModelPricing(resolveOpenAiModelPricing(id)),
    }));

  if (models.length === 0) {
    return { ok: false, message: "OpenAI returned no chat models." };
  }

  return { ok: true, models };
}
