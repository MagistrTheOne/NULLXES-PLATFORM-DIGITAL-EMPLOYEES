import { sanitizeEnvValue } from "@/shared/config/env";
import type { XaiVoiceEmployeeConfig } from "@/features/xai-voice/services/resolve-xai-voice-config";

/** Adeline Kalen — sandbox xAI Voice Agent pilot. */
export const ADELINE_KALEN_EMPLOYEE_ID =
  "b0ab9bc2-aed4-4e1c-875f-dfb9180d234a";

/** Anna — public landing Talk/Voice demo (Anam trial active). */
export const ANNA_LANDING_DEMO_EMPLOYEE_ID =
  "8f418ec3-286e-4bac-87e0-351783bec70e";

/** Employee shown on marketing landing plaque + public demos. */
export const LANDING_DEMO_EMPLOYEE_ID = ANNA_LANDING_DEMO_EMPLOYEE_ID;

const DEFAULT_ADELINE_AGENT_ID = "agent_yLXnJLDucVtucCck";
const DEFAULT_ANNA_AGENT_ID = "agent_8z4syR6vTpYwTujN";

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

export function readXaiVoiceAgentFromEnv(): string | null {
  return readEnv("XAI_VOICE_AGENT_ADELINE") || DEFAULT_ADELINE_AGENT_ID;
}

export function readAnnaXaiVoiceAgentFromEnv(): string | null {
  return readEnv("XAI_VOICE_AGENT_ANNA") || DEFAULT_ANNA_AGENT_ID;
}

export function buildXaiRealtimeWebSocketUrl(
  config: XaiVoiceEmployeeConfig,
): string {
  const params = new URLSearchParams({
    "reasoning.effort": "none",
  });

  if (config.mode === "console") {
    params.set("agent_id", config.agentId);
  } else {
    params.set("model", "grok-voice-latest");
  }

  return `wss://api.x.ai/v1/realtime?${params.toString()}`;
}
