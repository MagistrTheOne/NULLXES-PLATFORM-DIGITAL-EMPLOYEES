import { NextResponse } from "next/server";
import { assertBrainStreamRateLimit } from "@/features/runtime-session/lib/brain-stream-rate-limit";
import {
  recordTalkSla,
  type TalkSlaSpan,
} from "@/features/runtime-session/lib/talk-sla";
import { recordTalkSessionTurn } from "@/features/runtime-session/services/record-talk-session-turn";
import { resolveTalkBrainAuth } from "@/features/runtime-session/services/resolve-talk-brain-auth";
import type {
  TalkTurnFlags,
  TalkTurnSpanKey,
  TalkTurnSpans,
} from "@/features/runtime-session/types/talk-turn-metrics";
import { getDeploymentRegion } from "@/shared/config/deployment-profile";

export const runtime = "nodejs";

const SPAN_SLA_MAP: Partial<Record<TalkTurnSpanKey, TalkSlaSpan>> = {
  debounce: "talk.turn.debounce",
  brain_rtt: "talk.turn.brain_rtt",
  e2e: "talk.turn.e2e",
  build: "talk.brain.build",
  rag: "talk.brain.rag",
  ttfb: "talk.brain.ttfb",
  tool_loop: "talk.brain.tool_loop",
};

type TalkTelemetryRequest = {
  turnId?: string;
  employeeId?: string;
  sessionId?: string;
  voiceMode?: string;
  scenarioSessionId?: string;
  spans?: Partial<Record<TalkTurnSpanKey, number>>;
  flags?: TalkTurnFlags;
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
  const turnId = body.turnId?.trim();
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
    turnId,
    voiceMode: body.voiceMode,
    hasScenario: Boolean(body.scenarioSessionId),
    deploymentRegion: getDeploymentRegion(),
  };

  const normalizedSpans: TalkTurnSpans = {};
  for (const [name, durationMs] of Object.entries(spans) as Array<
    [TalkTurnSpanKey, unknown]
  >) {
    if (!isValidSpanDuration(durationMs)) {
      continue;
    }

    normalizedSpans[name] = Math.round(durationMs);

    const slaSpan = SPAN_SLA_MAP[name];
    if (slaSpan) {
      recordTalkSla({
        span: slaSpan,
        durationMs: normalizedSpans[name]!,
        tags,
      });
    }
  }

  if (sessionId && turnId && Object.keys(normalizedSpans).length > 0) {
    await recordTalkSessionTurn({
      sessionId,
      employeeId,
      turnId,
      voiceMode: body.voiceMode,
      spans: normalizedSpans,
      flags: body.flags,
    });
  }

  return new Response(null, { status: 204 });
}
