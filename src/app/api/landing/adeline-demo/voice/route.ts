import { NextResponse } from "next/server";
import { buildXaiVoiceSessionUpdate } from "@/features/xai-voice/lib/build-xai-voice-session-update";
import { createXaiVoiceClientSecret } from "@/features/xai-voice/services/create-xai-voice-client-secret";
import { resolveXaiVoiceConfigForEmployee } from "@/features/xai-voice/services/resolve-xai-voice-config";
import {
  LANDING_DEMO_RATE,
  LANDING_DEMO_RATE_BUCKET,
} from "@/features/landing/lib/landing-demo-rate-limits";
import {
  LANDING_DEMO_EMPLOYEE_ID,
  buildXaiRealtimeWebSocketUrl,
  getXaiApiKey,
} from "@/shared/config/xai-voice-env";
import type { XaiVoiceEmployeeConfig } from "@/features/xai-voice/services/resolve-xai-voice-config";
import { checkRateLimit } from "@/shared/security/rate-limit";
import { resolvePublicClientIpKey } from "@/shared/security/resolve-trusted-client-ip";

export const runtime = "nodejs";

/** Public landing trial — Anna (landing demo employee). */
export const LANDING_ADELINE_TRIAL_SECONDS = 60;

const ANNA_VOICE_FALLBACK: XaiVoiceEmployeeConfig = {
  mode: "platform",
  bindConsoleAgent: false,
  instructions:
    "You are Anna, a digital employee at NULLXES. Speak as Anna only. Keep answers concise. This is a one-minute public demo.",
  voice: "eve",
};

/**
 * Unauthenticated 60s Voice trial for the landing demo employee (Anna).
 * Rate-limited by IP. No tools.
 */
export async function POST(request: Request): Promise<Response> {
  const ip = resolvePublicClientIpKey(request);
  const rate = await checkRateLimit({
    name: LANDING_DEMO_RATE_BUCKET.voiceIp,
    key: ip,
    ...LANDING_DEMO_RATE.voiceIp,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trial limit reached. Try again later." },
      { status: 429 },
    );
  }

  const platformRate = await checkRateLimit({
    name: LANDING_DEMO_RATE_BUCKET.voicePlatform,
    key: "global",
    ...LANDING_DEMO_RATE.voicePlatform,
  });
  if (!platformRate.ok) {
    return NextResponse.json(
      { error: "Trial busy. Try again later." },
      { status: 429 },
    );
  }

  if (!getXaiApiKey()) {
    return NextResponse.json(
      { error: "Voice trial is temporarily unavailable." },
      { status: 503 },
    );
  }

  const voiceConfig =
    (await resolveXaiVoiceConfigForEmployee(LANDING_DEMO_EMPLOYEE_ID)) ??
    ANNA_VOICE_FALLBACK;

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
