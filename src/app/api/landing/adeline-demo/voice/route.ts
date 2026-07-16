import { NextResponse } from "next/server";
import { buildXaiVoiceSessionUpdate } from "@/features/xai-voice/lib/build-xai-voice-session-update";
import { createXaiVoiceClientSecret } from "@/features/xai-voice/services/create-xai-voice-client-secret";
import { resolveXaiVoiceConfigForEmployee } from "@/features/xai-voice/services/resolve-xai-voice-config";
import {
  LANDING_DEMO_EMPLOYEE_ID,
  buildXaiRealtimeWebSocketUrl,
  getXaiApiKey,
  readAnnaXaiVoiceAgentFromEnv,
} from "@/shared/config/xai-voice-env";
import type { XaiVoiceEmployeeConfig } from "@/features/xai-voice/services/resolve-xai-voice-config";

export const runtime = "nodejs";

/** Public landing trial — Anna (landing demo employee). */
export const LANDING_ADELINE_TRIAL_SECONDS = 60;

function annaVoiceFallback(): XaiVoiceEmployeeConfig {
  return {
    mode: "console",
    bindConsoleAgent: true,
    agentId: readAnnaXaiVoiceAgentFromEnv() || "agent_8z4syR6vTpYwTuj",
    voice: "",
  };
}

/**
 * Unauthenticated 60s Voice trial for the landing demo employee (Anna).
 * No per-IP trial caps.
 */
export async function POST(_request: Request): Promise<Response> {
  if (!getXaiApiKey()) {
    return NextResponse.json(
      { error: "Voice trial is temporarily unavailable." },
      { status: 503 },
    );
  }

  const voiceConfig =
    (await resolveXaiVoiceConfigForEmployee(LANDING_DEMO_EMPLOYEE_ID)) ??
    annaVoiceFallback();

  const clientSecret = await createXaiVoiceClientSecret();
  if (!clientSecret) {
    return NextResponse.json(
      { error: "Failed to create voice trial session." },
      { status: 503 },
    );
  }

  const session = buildXaiVoiceSessionUpdate({
    enabledToolSlugs: [],
    bindConsoleAgent: voiceConfig.bindConsoleAgent,
    instructions:
      voiceConfig.mode === "platform"
        ? (voiceConfig.instructions ??
          "You are Anna, a digital employee at NULLXES. Speak as Anna only. Keep answers concise. This is a one-minute public demo.")
        : undefined,
    voice: voiceConfig.bindConsoleAgent ? undefined : voiceConfig.voice,
  });

  return NextResponse.json({
    clientSecret: clientSecret.value,
    expiresAt: clientSecret.expiresAt ?? null,
    websocketUrl: buildXaiRealtimeWebSocketUrl(voiceConfig),
    agentId: voiceConfig.mode === "console" ? voiceConfig.agentId : null,
    bindConsoleAgent: voiceConfig.bindConsoleAgent,
    session,
    maxDurationSec: LANDING_ADELINE_TRIAL_SECONDS,
    employeeId: LANDING_DEMO_EMPLOYEE_ID,
  });
}
