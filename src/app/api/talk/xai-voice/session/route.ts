import { NextResponse } from "next/server";
import { buildXaiVoiceSessionUpdate } from "@/features/xai-voice/lib/build-xai-voice-session-update";
import { createXaiVoiceClientSecret } from "@/features/xai-voice/services/create-xai-voice-client-secret";
import { resolveXaiVoiceConfigForEmployee } from "@/features/xai-voice/services/resolve-xai-voice-config";
import { assertBrainStreamRateLimit } from "@/features/runtime-session/lib/brain-stream-rate-limit";
import { talkApiJsonResponse } from "@/features/runtime-session/lib/talk-api-errors";
import { buildTalkSessionBrainCache } from "@/features/runtime-session/services/build-talk-session-brain-cache";
import { getEmployeeTalkContext } from "@/features/runtime-session/services/get-employee-talk-context";
import { resolveTalkBrainAuth } from "@/features/runtime-session/services/resolve-talk-brain-auth";
import { buildXaiRealtimeWebSocketUrl } from "@/shared/config/xai-voice-env";

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

  const rateLimit = await assertBrainStreamRateLimit({
    userId: authResult.auth.userId,
    employeeId,
    organizationId: authResult.auth.organizationId,
  });

  if (!rateLimit.ok) {
    return talkApiJsonResponse(rateLimit.code, rateLimit.error, 429);
  }

  const voiceConfig = await resolveXaiVoiceConfigForEmployee(employeeId);
  if (!voiceConfig) {
    return NextResponse.json(
      { error: "xAI voice is not configured for this employee" },
      { status: 404 },
    );
  }

  const needsBrainCache =
    voiceConfig.mode === "platform" && !voiceConfig.instructions;

  const [clientSecret, employeeContext, brainCache] = await Promise.all([
    createXaiVoiceClientSecret(),
    getEmployeeTalkContext(authResult.auth.organizationId, employeeId),
    needsBrainCache
      ? buildTalkSessionBrainCache({
          organizationId: authResult.auth.organizationId,
          employeeId,
        })
      : Promise.resolve(null),
  ]);

  if (!employeeContext) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  if (!clientSecret) {
    return NextResponse.json(
      { error: "Failed to create xAI voice session token" },
      { status: 503 },
    );
  }

  const instructions =
    voiceConfig.mode === "platform"
      ? (voiceConfig.instructions ??
        brainCache?.systemPromptBase ??
        "You are a NULLXES digital employee. Respond concisely in Russian unless asked otherwise.")
      : undefined;

  const session = buildXaiVoiceSessionUpdate({
    enabledToolSlugs: employeeContext.enabledToolSlugs,
    bindConsoleAgent: voiceConfig.bindConsoleAgent,
    instructions,
    voice: voiceConfig.bindConsoleAgent ? undefined : voiceConfig.voice,
  });

  return NextResponse.json({
    clientSecret: clientSecret.value,
    expiresAt: clientSecret.expiresAt ?? null,
    websocketUrl: buildXaiRealtimeWebSocketUrl(voiceConfig),
    agentId:
      voiceConfig.mode === "console" ? voiceConfig.agentId : null,
    bindConsoleAgent: voiceConfig.bindConsoleAgent,
    session,
  });
}
