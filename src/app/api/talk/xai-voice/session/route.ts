import { NextResponse } from "next/server";
import { buildXaiVoiceSessionUpdate } from "@/features/xai-voice/lib/build-xai-voice-session-update";
import { createXaiVoiceClientSecret } from "@/features/xai-voice/services/create-xai-voice-client-secret";
import { resolveXaiVoiceConfigForEmployee } from "@/features/xai-voice/services/resolve-xai-voice-config";
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

  const voiceConfig = await resolveXaiVoiceConfigForEmployee(employeeId);
  if (!voiceConfig) {
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

  const needsInstructions = !voiceConfig.bindConsoleAgent;

  const [clientSecret, employeeContext, brainCache] = await Promise.all([
    createXaiVoiceClientSecret(),
    getEmployeeTalkContext(authResult.auth.organizationId, employeeId),
    needsInstructions
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
    brainCache?.systemPromptBase ??
    "You are a NULLXES digital employee. Respond concisely in Russian unless asked otherwise.";

  const session = buildXaiVoiceSessionUpdate({
    enabledToolSlugs: employeeContext.enabledToolSlugs,
    bindConsoleAgent: voiceConfig.bindConsoleAgent,
    instructions,
  });

  return NextResponse.json({
    clientSecret: clientSecret.value,
    expiresAt: clientSecret.expiresAt ?? null,
    websocketUrl: buildXaiRealtimeWebSocketUrl(voiceConfig.agentId),
    agentId: voiceConfig.agentId,
    bindConsoleAgent: voiceConfig.bindConsoleAgent,
    session,
  });
}
