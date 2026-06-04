const OPENAI_API_BASE_URL_DEFAULT = "https://api.openai.com/v1";
const ANAM_API_BASE_URL_DEFAULT = "https://api.anam.ai/v1";

export function getOpenAiApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

export function getAnamApiKey(): string | undefined {
  const key = process.env.ANAM_API_KEY?.trim();
  return key || undefined;
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

export function hasAnamCredentials(): boolean {
  return Boolean(getAnamApiKey());
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
