import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import type { TalkPipelineMessage } from "@/features/runtime-session/actions/talk-voice-pipeline";
import { trimTalkHistory } from "@/features/runtime-session/lib/trim-talk-history";
import { buildTalkBrainRequest } from "@/features/runtime-session/services/build-talk-brain-request";
import { streamTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";
import { LANDING_DEMO_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { db } from "@/shared/db/client";
import { checkRateLimit } from "@/shared/security/rate-limit";
import { resolvePublicClientIpKey } from "@/shared/security/resolve-trusted-client-ip";
import { logServerEvent } from "@/shared/lib/server-log";

export const runtime = "nodejs";

type BrainStreamRequest = {
  employeeId?: string;
  messages?: TalkPipelineMessage[];
};

/**
 * Public landing-demo brain stream (Anna) for the marketing Talk trial.
 * No tools, IP rate-limited, no workspace auth.
 * Brain surface is `landing` — persona only (no private RAG / live org state).
 */
export async function POST(request: Request): Promise<Response> {
  const ip = resolvePublicClientIpKey(request);
  const rate = await checkRateLimit({
    name: "landing-adeline-brain",
    key: ip,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: "Demo brain limit reached. Try again later." },
      { status: 429 },
    );
  }

  const platformRate = await checkRateLimit({
    name: "landing-adeline-brain-platform",
    key: "global",
    limit: 400,
    windowMs: 60 * 60 * 1000,
  });
  if (!platformRate.ok) {
    return NextResponse.json(
      { error: "Demo brain busy. Try again later." },
      { status: 429 },
    );
  }

  let body: BrainStreamRequest;
  try {
    body = (await request.json()) as BrainStreamRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  const messages = body.messages;

  if (employeeId !== LANDING_DEMO_EMPLOYEE_ID) {
    return NextResponse.json({ error: "Demo brain is landing-demo only" }, { status: 403 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
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

  const [employee] = await db
    .select({
      id: digitalEmployee.id,
      organizationId: digitalEmployee.organizationId,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, LANDING_DEMO_EMPLOYEE_ID))
    .limit(1);

  if (!employee) {
    return NextResponse.json(
      { error: "Talk demo is temporarily unavailable." },
      { status: 503 },
    );
  }

  const recentMessages = trimTalkHistory(messages);
  const openAiMessages = recentMessages.map((message) => ({
    role: (message.role === "user" ? "user" : "assistant") as
      | "user"
      | "assistant",
    content: message.content,
  }));

  const buildResult = await buildTalkBrainRequest({
    organizationId: employee.organizationId,
    employeeId: employee.id,
    messages: openAiMessages,
    surface: "landing",
  });

  const config = buildResult.config;
  if (!config) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const identityLock = `Identity lock: You are ${employee.name}, ${employee.role}. Never introduce yourself as Eve, Ara, or any other name. Speak as a woman matching this role.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: "perf",
              spans: {
                build: buildResult.perf.buildMs,
                ...(buildResult.perf.ragMs !== null
                  ? { rag: buildResult.perf.ragMs }
                  : {}),
              },
              flags: { ...buildResult.flags, slaDegrade: false },
            })}\n`,
          ),
        );

        for await (const event of streamTalkBrainResponse({
          brainProvider: config.brainProvider,
          model: config.model,
          systemPrompt: `${config.systemPrompt}\n\n${identityLock}\n\nYou are in a one-minute public landing demo. Keep answers concise.`,
          messages: openAiMessages,
          temperature: config.temperature,
          maxTokens: Math.min(config.maxTokens, 400),
          tools: undefined,
          toolContext: undefined,
          mode: "talk",
        })) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Brain stream failed";
        logServerEvent(
          "landing.adeline_brain.error",
          { employeeId, message },
          "error",
        );
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
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
      "Cache-Control": "no-store",
    },
  });
}
