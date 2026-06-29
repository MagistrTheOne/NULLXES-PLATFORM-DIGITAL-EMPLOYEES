import { NextResponse } from "next/server";
import type { TalkPipelineMessage } from "@/features/runtime-session/actions/talk-voice-pipeline";
import { assertBrainStreamRateLimit } from "@/features/runtime-session/lib/brain-stream-rate-limit";
import { resolveTalkBrainTools } from "@/features/runtime-session/lib/resolve-talk-brain-tools";
import { buildTalkBrainRequest } from "@/features/runtime-session/services/build-talk-brain-request";
import { resolveTalkBrainAuth } from "@/features/runtime-session/services/resolve-talk-brain-auth";
import { streamTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";
import { logServerEvent } from "@/shared/lib/server-log";

export const runtime = "nodejs";

type BrainStreamRequest = {
  employeeId?: string;
  sessionId?: string;
  messages?: TalkPipelineMessage[];
};

export async function POST(request: Request): Promise<Response> {
  let body: BrainStreamRequest;
  try {
    body = (await request.json()) as BrainStreamRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  const sessionId = body.sessionId?.trim();
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

  const rateLimit = assertBrainStreamRateLimit({
    userId: authResult.auth.userId,
    employeeId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 });
  }

  const config = await buildTalkBrainRequest({
    organizationId: authResult.auth.organizationId,
    employeeId,
    messages: messages.map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: message.content,
    })),
  });

  if (!config) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const openAiMessages = messages.map((message) => ({
    role: (message.role === "user" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: message.content,
  }));

  const talkTools = resolveTalkBrainTools(lastMessage.content);
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
          encoder.encode(`${JSON.stringify({ error: message })}\n`),
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
