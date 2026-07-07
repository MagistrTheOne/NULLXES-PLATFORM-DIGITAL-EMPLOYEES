import { sanitizeEnvValue } from "@/shared/config/env";

/** Adeline Kalen — sandbox xAI Voice Agent pilot. */
export const ADELINE_KALEN_EMPLOYEE_ID =
  "b0ab9bc2-aed4-4e1c-875f-dfb9180d234a";

const DEFAULT_ADELINE_AGENT_ID = "agent_yLXnJLDucVtucCck";

function readEnv(name: string): string | undefined {
  const value = sanitizeEnvValue(process.env[name]);
  return value && value.length > 0 ? value : undefined;
}

export function getXaiApiKey(): string | undefined {
  return readEnv("XAI_API_KEY");
}

export function isXaiVoiceConfigured(): boolean {
  return Boolean(getXaiApiKey());
}

export function resolveXaiVoiceAgentId(employeeId: string): string | null {
  if (employeeId !== ADELINE_KALEN_EMPLOYEE_ID) {
    return null;
  }

  if (!isXaiVoiceConfigured()) {
    return null;
  }

  return (
    readEnv("XAI_VOICE_AGENT_ADELINE") || DEFAULT_ADELINE_AGENT_ID
  );
}

export function isXaiVoiceAvailableForEmployee(employeeId: string): boolean {
  return Boolean(resolveXaiVoiceAgentId(employeeId));
}

export const XAI_REALTIME_MODEL = "grok-voice-latest";

export function buildXaiRealtimeWebSocketUrl(): string {
  return `wss://api.x.ai/v1/realtime?model=${XAI_REALTIME_MODEL}`;
}
