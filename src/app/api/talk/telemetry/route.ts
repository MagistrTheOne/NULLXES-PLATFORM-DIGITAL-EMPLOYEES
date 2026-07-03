import { NextResponse } from "next/server";
import { assertBrainStreamRateLimit } from "@/features/runtime-session/lib/brain-stream-rate-limit";
import {
  recordTalkSla,
  type TalkSlaSpan,
} from "@/features/runtime-session/lib/talk-sla";
import { resolveTalkBrainAuth } from "@/features/runtime-session/services/resolve-talk-brain-auth";
import { getDeploymentRegion } from "@/shared/config/deployment-profile";

export const runtime = "nodejs";

type TalkTurnSpanName = "debounce" | "brain_rtt" | "e2e";

const CLIENT_SPAN_MAP: Record<TalkTurnSpanName, TalkSlaSpan> = {
  debounce: "talk.turn.debounce",
  brain_rtt: "talk.turn.brain_rtt",
  e2e: "talk.turn.e2e",
};

type TalkTelemetryRequest = {
  turnId?: string;
  employeeId?: string;
  sessionId?: string;
  voiceMode?: string;
  scenarioSessionId?: string;
  spans?: Partial<Record<TalkTurnSpanName, number>>;
};

function isValidSpanDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export async function POST(request: Request): Promise<Response> {
  let body: TalkTelemetryRequest;
  try {
    body = (await request.json()) as TalkTelemetryRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  const sessionId = body.sessionId?.trim();
  const spans = body.spans;

  if (!employeeId || !spans || typeof spans !== "object") {
    return NextResponse.json(
      { error: "employeeId and spans are required" },
      { status: 400 },
    );
  }

  const authResult = await resolveTalkBrainAuth({
    employeeId,
    sessionId: sessionId || undefined,
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
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 });
  }

  const tags = {
    employeeId,
    turnId: body.turnId,
    voiceMode: body.voiceMode,
    hasScenario: Boolean(body.scenarioSessionId),
    deploymentRegion: getDeploymentRegion(),
  };

  for (const [name, durationMs] of Object.entries(spans) as Array<
    [TalkTurnSpanName, unknown]
  >) {
    const slaSpan = CLIENT_SPAN_MAP[name];
    if (!slaSpan || !isValidSpanDuration(durationMs)) {
      continue;
    }

    recordTalkSla({
      span: slaSpan,
      durationMs,
      tags,
    });
  }

  return new Response(null, { status: 204 });
}
