import {
  AGENT_TOOL_DEFINITIONS,
  TALK_AGENT_TOOL_DEFINITIONS,
  type AgentToolDefinition,
  executeAgentTool,
  type AgentToolExecutionContext,
} from "@/features/agent-tools";
import type { BrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { resolveBrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { formatBrainModelDisplay } from "@/features/brain/lib/format-brain-model-display";
import { logTalkPerf } from "@/features/runtime-session/lib/talk-perf-log";
import type { BrainProvider } from "@/entities/digital-employee";
import type { TalkBrainMessage } from "./generate-talk-brain-response";

type OpenAiStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
      reasoning?: string | null;
    };
    finish_reason?: string | null;
  }>;
};

type OpenAiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type OpenAiCompletionMessage = {
  role: "assistant";
  content: string | null;
  reasoning?: string | null;
  tool_calls?: OpenAiToolCall[];
};

type OpenAiChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type TalkBrainStreamEvent =
  | { type: "meta"; brainProvider: BrainProvider; model: string; modelLabel: string }
  | { type: "content"; content: string }
  | { type: "tool"; tool: string; phase: "start" | "done" };

const MAX_TOOL_ITERATIONS = 8;
const MAX_TOOL_ITERATIONS_TALK = 5;

async function callBrainChat(input: {
  api: BrainApiConfig;
  messages: OpenAiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: typeof AGENT_TOOL_DEFINITIONS;
  stream?: boolean;
  responseFormat?: { type: "json_object" };
}): Promise<Response> {
  return fetch(`${input.api.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.api.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.api.model,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 1024,
      stream: input.stream ?? false,
      messages: input.messages,
      ...(input.tools ? { tools: input.tools } : {}),
      ...(input.responseFormat ? { response_format: input.responseFormat } : {}),
    }),
  });
}

async function* runToolLoopStream(input: {
  api: BrainApiConfig;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
  toolContext?: AgentToolExecutionContext;
  mode?: "talk" | "default";
  tools?: AgentToolDefinition[];
}): AsyncGenerator<TalkBrainStreamEvent, OpenAiChatMessage[]> {
  const conversation: OpenAiChatMessage[] = [
    { role: "system", content: input.systemPrompt },
    ...input.messages.map(
      (message): OpenAiChatMessage => ({
        role: message.role,
        content: message.content,
      }),
    ),
  ];

  if (!input.toolContext || !input.api.supportsTools) {
    return conversation;
  }

  const toolDefinitions =
    input.tools ??
    (input.mode === "talk"
      ? TALK_AGENT_TOOL_DEFINITIONS
      : AGENT_TOOL_DEFINITIONS);
  const maxIterations =
    input.mode === "talk" ? MAX_TOOL_ITERATIONS_TALK : MAX_TOOL_ITERATIONS;
  const toolLoopStartedAt = performance.now();

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const response = await callBrainChat({
      api: input.api,
      messages: conversation,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      tools: toolDefinitions,
      stream: false,
    });

    if (!response.ok) {
      throw new Error(`Brain tool loop failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: OpenAiCompletionMessage; finish_reason?: string }>;
    };

    const message = payload.choices?.[0]?.message;
    if (!message) {
      break;
    }

    if (!message.tool_calls?.length) {
      break;
    }

    conversation.push({
      role: "assistant",
      content: message.content,
      tool_calls: message.tool_calls,
    });

    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      yield { type: "tool", tool: toolName, phase: "start" };

      const result = await executeAgentTool({
        toolName,
        argumentsJson: toolCall.function.arguments,
        context: input.toolContext,
      });

      conversation.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.content,
      });

      yield { type: "tool", tool: toolName, phase: "done" };
    }
  }

  logTalkPerf("talk.brain.tool_loop", {
    mode: input.mode ?? "default",
    provider: input.api.provider,
    duration_ms: Math.round(performance.now() - toolLoopStartedAt),
  });

  return conversation;
}

export async function* streamTalkBrainResponse(input: {
  brainProvider: BrainProvider;
  model: string;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
  toolContext?: AgentToolExecutionContext;
  tools?: AgentToolDefinition[];
  mode?: "talk" | "default";
  responseFormat?: { type: "json_object" };
}): AsyncGenerator<TalkBrainStreamEvent> {
  const api = await resolveBrainApiConfig({
    provider: input.brainProvider,
    configuredModel: input.model,
    organizationId: input.toolContext?.organizationId,
  });

  yield {
    type: "meta",
    brainProvider: api.provider,
    model: api.model,
    modelLabel: formatBrainModelDisplay({
      provider: api.provider,
      modelId: api.model,
    }),
  };

  const toolLoop = runToolLoopStream({ ...input, api });
  let toolStep = await toolLoop.next();

  while (!toolStep.done) {
    yield toolStep.value;
    toolStep = await toolLoop.next();
  }

  const conversation = toolStep.value;
  const streamStartedAt = performance.now();
  let firstTokenLogged = false;
  let streamedContent = "";

  const response = await callBrainChat({
    api,
    messages: conversation,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    stream: true,
    responseFormat: input.responseFormat,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Brain stream failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }

      const chunk = JSON.parse(payload) as OpenAiStreamChunk;
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        streamedContent += content;
        if (!firstTokenLogged) {
          firstTokenLogged = true;
          logTalkPerf("talk.brain.ttfb", {
            mode: input.mode ?? "default",
            provider: api.provider,
            duration_ms: Math.round(performance.now() - streamStartedAt),
          });
        }
        yield { type: "content", content };
      }
    }
  }

  if (!streamedContent.trim() && api.provider === "nullxes") {
    const fallback = await callBrainChat({
      api,
      messages: conversation,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      stream: false,
      responseFormat: input.responseFormat,
    });

    if (!fallback.ok) {
      throw new Error(`Brain fallback failed with status ${fallback.status}`);
    }

    const payload = (await fallback.json()) as {
      choices?: Array<{ message?: OpenAiCompletionMessage }>;
    };
    const fallbackContent = payload.choices?.[0]?.message?.content?.trim() ?? "";

    if (fallbackContent) {
      yield { type: "content", content: fallbackContent };
    }
  }
}

export async function collectTalkBrainResponse(
  input: Parameters<typeof streamTalkBrainResponse>[0],
): Promise<string> {
  let reply = "";

  for await (const event of streamTalkBrainResponse(input)) {
    if (event.type === "content") {
      reply += event.content;
    }
  }

  const trimmed = reply.trim();
  if (!trimmed) {
    throw new Error("Brain returned an empty response");
  }

  return trimmed;
}
