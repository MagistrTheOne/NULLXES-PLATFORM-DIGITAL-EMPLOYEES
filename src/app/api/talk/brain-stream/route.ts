import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { TalkPipelineMessage } from "@/features/runtime-session/actions/talk-voice-pipeline";
import { assertBrainStreamRateLimit } from "@/features/runtime-session/lib/brain-stream-rate-limit";
import { talkApiJsonResponse } from "@/features/runtime-session/lib/talk-api-errors";
import { shouldDegradeTalkBrainTurn } from "@/features/runtime-session/lib/talk-sla";
import { resolveTalkBrainTools } from "@/features/runtime-session/lib/resolve-talk-brain-tools";
import { trimTalkHistory } from "@/features/runtime-session/lib/trim-talk-history";
import { buildTalkBrainRequest } from "@/features/runtime-session/services/build-talk-brain-request";
import { checkForeignDataProcessingAllowed } from "@/features/privacy/services/assert-foreign-data-processing";
import { resolveTalkBrainAuth } from "@/features/runtime-session/services/resolve-talk-brain-auth";
import { streamTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";
import { logServerEvent } from "@/shared/lib/server-log";

export const runtime = "nodejs";

type BrainStreamRequest = {
  employeeId?: string;
  sessionId?: string;
  turnId?: string;
  scenarioSessionId?: string;
  messages?: TalkPipelineMessage[];
};

async function handleBrainStreamPost(request: Request): Promise<Response> {
  let body: BrainStreamRequest;
  try {
    body = (await request.json()) as BrainStreamRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  const sessionId = body.sessionId?.trim();
  const turnId = body.turnId?.trim();
  const scenarioSessionId = body.scenarioSessionId?.trim();
  const messages = body.messages;

  if (!employeeId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "employeeId and messages are required" },
      { status: 400 },
    );
  }

  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from the user" },
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
    return talkApiJsonResponse(rateLimit.code, rateLimit.error, 429);
  }

  const recentMessages = trimTalkHistory(messages);
  const openAiMessages = recentMessages.map((message) => ({
    role: (message.role === "user" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: message.content,
  }));

  const [regionCheck, buildResult] = await Promise.all([
    checkForeignDataProcessingAllowed(authResult.auth.organizationId, "openai"),
    buildTalkBrainRequest({
      organizationId: authResult.auth.organizationId,
      employeeId,
      userId: authResult.auth.userId,
      sessionId: sessionId || undefined,
      scenarioSessionId: scenarioSessionId || undefined,
      messages: openAiMessages,
    }),
  ]);

  if (!regionCheck.allowed) {
    return talkApiJsonResponse("REGION_BLOCKED", regionCheck.message, 403);
  }

  const config = buildResult.config;
  if (!config) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const slaDegrade = shouldDegradeTalkBrainTurn(buildResult.perf);

  const talkTools = slaDegrade
    ? undefined
    : resolveTalkBrainTools(lastMessage.content, config.enabledToolSlugs);
  const toolContext = talkTools
    ? {
        organizationId: authResult.auth.organizationId,
        employeeId,
        sessionId: sessionId || undefined,
      }
    : undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: "perf",
              turnId: turnId ?? null,
              spans: {
                build: buildResult.perf.buildMs,
                ...(buildResult.perf.ragMs !== null
                  ? { rag: buildResult.perf.ragMs }
                  : {}),
              },
              flags: { ...buildResult.flags, slaDegrade },
            })}\n`,
          ),
        );

        for await (const event of streamTalkBrainResponse({
          brainProvider: config.brainProvider,
          model: config.model,
          systemPrompt: config.systemPrompt,
          messages: openAiMessages,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          toolContext,
          tools: talkTools,
          mode: "talk",
        })) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Brain stream failed";
        logServerEvent(
          "talk.brain_stream.error",
          { employeeId, message },
          "error",
        );
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              code: "PROVIDER_UNAVAILABLE",
              error: "Unable to generate a response. Please try again.",
            })}\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  return Sentry.startSpan(
    {
      name: "talk.brain_stream",
      op: "http.server",
      attributes: {
        "talk.route": "/api/talk/brain-stream",
      },
    },
    () => handleBrainStreamPost(request),
  );
}
