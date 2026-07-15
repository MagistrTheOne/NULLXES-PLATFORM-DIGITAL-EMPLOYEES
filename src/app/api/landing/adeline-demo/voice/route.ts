import { NextResponse } from "next/server";
import { buildXaiVoiceSessionUpdate } from "@/features/xai-voice/lib/build-xai-voice-session-update";
import { createXaiVoiceClientSecret } from "@/features/xai-voice/services/create-xai-voice-client-secret";
import { resolveXaiVoiceConfigForEmployee } from "@/features/xai-voice/services/resolve-xai-voice-config";
import {
  ADELINE_KALEN_EMPLOYEE_ID,
  buildXaiRealtimeWebSocketUrl,
} from "@/shared/config/xai-voice-env";
import { checkRateLimit } from "@/shared/security/rate-limit";

export const runtime = "nodejs";

/** Public landing trial — Adeline only. */
export const LANDING_ADELINE_TRIAL_SECONDS = 60;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Unauthenticated 60s Voice trial for Adeline Kalen on the marketing landing.
 * Rate-limited by IP. No tools. Console agent when configured.
 */
export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request);
  const rate = await checkRateLimit({
    name: "landing-adeline-voice",
    key: ip,
    limit: 4,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trial limit reached. Try again later." },
      { status: 429 },
    );
  }

  const platformRate = await checkRateLimit({
    name: "landing-adeline-voice-platform",
    key: "global",
    limit: 80,
    windowMs: 60 * 60 * 1000,
  });
  if (!platformRate.ok) {
    return NextResponse.json(
      { error: "Trial busy. Try again later." },
      { status: 429 },
    );
  }

  const voiceConfig = await resolveXaiVoiceConfigForEmployee(
    ADELINE_KALEN_EMPLOYEE_ID,
  );
  if (!voiceConfig) {
    return NextResponse.json(
      { error: "Adeline voice trial is temporarily unavailable." },
      { status: 503 },
    );
  }

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
          "You are Adeline Kalen, Head of the Interworld Department at NULLXES. Speak as Adeline only — never as Eve or any other name. Keep answers concise. This is a one-minute public demo.")
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
    employeeId: ADELINE_KALEN_EMPLOYEE_ID,
  });
}
