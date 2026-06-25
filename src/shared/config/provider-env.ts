const OPENAI_API_BASE_URL_DEFAULT = "https://api.openai.com/v1";
const ANAM_API_BASE_URL_DEFAULT = "https://api.anam.ai/v1";

import { getAnamApiKeyBySlot, getAnamApiKeyPool } from "./anam-api-pool";

export {
  ANAM_API_KEY_SLOTS,
  anamFetchWithKeyPool,
  anamFetchWithSlot,
  getAnamApiKeyBySlot,
  getAnamApiKeyPool,
  isAnamAvatarQuotaError,
  readAnamErrorMessage,
} from "./anam-api-pool";
export type { AnamApiKeyPoolEntry, AnamApiKeySlot } from "./anam-api-pool";

export function getOpenAiApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

export function getAnamApiKey(): string | undefined {
  return getAnamApiKeyPool()[0]?.key;
}

export function getOpenAiApiBaseUrl(): string {
  return process.env.OPENAI_API_BASE_URL?.trim() || OPENAI_API_BASE_URL_DEFAULT;
}

export function getAnamApiBaseUrl(): string {
  return process.env.ANAM_API_BASE_URL?.trim() || ANAM_API_BASE_URL_DEFAULT;
}

export function hasOpenAiCredentials(): boolean {
  return Boolean(getOpenAiApiKey());
}

export function getAnthropicApiKey(): string | undefined {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key || undefined;
}

export function hasAnthropicCredentials(): boolean {
  return Boolean(getAnthropicApiKey());
}

export function getGoogleApiKey(): string | undefined {
  const key =
    process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  return key || undefined;
}

export function hasGoogleCredentials(): boolean {
  return Boolean(getGoogleApiKey());
}

export function getOpenAiEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}

export function getOpenAiEmbeddingDimensions(): number {
  return 1536;
}

export function hasAnamCredentials(): boolean {
  return getAnamApiKeyPool().length > 0;
}

export function getElevenLabsApiKey(): string | undefined {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  return key || undefined;
}

export function getElevenLabsApiBaseUrl(): string {
  return (
    process.env.ELEVENLABS_API_BASE_URL?.trim() || "https://api.elevenlabs.io"
  );
}

export function getElevenLabsDefaultVoiceId(): string {
  return (
    process.env.ELEVENLABS_DEFAULT_VOICE_ID?.trim() || "JBFqnCBsd6RMkjVDRZzb"
  );
}

export function hasElevenLabsCredentials(): boolean {
  return Boolean(getElevenLabsApiKey());
}

const NULLXES_BRAIN_MODEL_DEFAULT = "MagistrTheOne/SHUTEN-DOJI";

/** NULLXES SHUTEN-DŌJI on RunPod vLLM — OpenAI-compatible /v1/chat/completions */
export function getNullxesBrainApiBaseUrl(): string | undefined {
  const url = process.env.NULLXES_BRAIN_API_BASE_URL?.trim();
  return url || undefined;
}

export function getNullxesBrainApiKey(): string | undefined {
  const key = process.env.NULLXES_BRAIN_API_KEY?.trim();
  if (key) {
    return key;
  }

  if (getNullxesBrainApiBaseUrl()) {
    return "nullxes";
  }

  return undefined;
}

export function getNullxesBrainModel(): string {
  return process.env.NULLXES_BRAIN_MODEL?.trim() || NULLXES_BRAIN_MODEL_DEFAULT;
}

export function resolveNullxesBrainModel(
  configuredModel?: string | null,
): string {
  const model = configuredModel?.trim();
  if (!model || model === "nullxes-brain-v1") {
    return getNullxesBrainModel();
  }

  return model;
}

export function hasNullxesBrainCredentials(): boolean {
  return Boolean(getNullxesBrainApiBaseUrl());
}

export function nullxesBrainSupportsTools(): boolean {
  return process.env.NULLXES_BRAIN_SUPPORTS_TOOLS?.trim() === "true";
}
