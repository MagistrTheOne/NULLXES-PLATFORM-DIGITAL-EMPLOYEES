import { NextResponse } from "next/server";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import type { TalkPipelineMessage } from "@/features/runtime-session/actions/talk-voice-pipeline";
import { buildTalkBrainRequest } from "@/features/runtime-session/services/build-talk-brain-request";
import { streamTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";

export const runtime = "nodejs";

type BrainStreamRequest = {
  employeeId?: string;
  sessionId?: string;
  messages?: TalkPipelineMessage[];
};

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  const config = await buildTalkBrainRequest({
    organizationId: workspace.organization.id,
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const content of streamTalkBrainResponse({
          model: config.model,
          systemPrompt: config.systemPrompt,
          messages: openAiMessages,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          toolContext: {
            organizationId: workspace.organization.id,
            employeeId,
            sessionId: sessionId || undefined,
          },
          mode: "talk",
        })) {
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ content })}\n`),
          );
        }
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Brain stream failed";
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
