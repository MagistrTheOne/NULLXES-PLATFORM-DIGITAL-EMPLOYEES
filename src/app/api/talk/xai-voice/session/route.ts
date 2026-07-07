import { NextResponse } from "next/server";
import { buildTalkSessionBrainCache } from "@/features/runtime-session/services/build-talk-session-brain-cache";
import { resolveTalkBrainAuth } from "@/features/runtime-session/services/resolve-talk-brain-auth";
import { createXaiVoiceClientSecret } from "@/features/xai-voice/services/create-xai-voice-client-secret";
import {
  buildXaiRealtimeWebSocketUrl,
  resolveXaiVoiceAgentId,
} from "@/shared/config/xai-voice-env";

export const runtime = "nodejs";

type XaiVoiceSessionRequest = {
  employeeId?: string;
  sessionId?: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: XaiVoiceSessionRequest;
  try {
    body = (await request.json()) as XaiVoiceSessionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }

  const agentId = resolveXaiVoiceAgentId(employeeId);
  if (!agentId) {
    return NextResponse.json(
      { error: "xAI voice is not configured for this employee" },
      { status: 404 },
    );
  }

  const authResult = await resolveTalkBrainAuth({
    employeeId,
    sessionId: body.sessionId?.trim() || undefined,
  });

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const [clientSecret, brainCache] = await Promise.all([
    createXaiVoiceClientSecret(),
    buildTalkSessionBrainCache({
      organizationId: authResult.auth.organizationId,
      employeeId,
    }),
  ]);

  if (!clientSecret) {
    return NextResponse.json(
      { error: "Failed to create xAI voice session token" },
      { status: 503 },
    );
  }

  const instructions =
    brainCache?.systemPromptBase ??
    "You are a NULLXES digital employee. Respond concisely in Russian unless asked otherwise.";

  return NextResponse.json({
    clientSecret: clientSecret.value,
    expiresAt: clientSecret.expiresAt ?? null,
    websocketUrl: buildXaiRealtimeWebSocketUrl(),
    agentId,
    session: {
      instructions,
      turn_detection: { type: "server_vad" },
    },
  });
}
