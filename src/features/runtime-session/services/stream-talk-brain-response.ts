import {
  AGENT_TOOL_DEFINITIONS,
  TALK_AGENT_TOOL_DEFINITIONS,
  executeAgentTool,
  type AgentToolExecutionContext,
} from "@/features/agent-tools";
import { logTalkPerf } from "@/features/runtime-session/lib/talk-perf-log";
import { getOpenAiApiBaseUrl, getOpenAiApiKey } from "@/shared/config/provider-env";
import type { TalkBrainMessage } from "./generate-talk-brain-response";

type OpenAiStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
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
  tool_calls?: OpenAiToolCall[];
};

type OpenAiChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

const MAX_TOOL_ITERATIONS = 3;
const MAX_TOOL_ITERATIONS_TALK = 1;

async function callOpenAiChat(input: {
  model: string;
  messages: OpenAiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: typeof AGENT_TOOL_DEFINITIONS;
  stream?: boolean;
}): Promise<Response> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return fetch(`${getOpenAiApiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 1024,
      stream: input.stream ?? false,
      messages: input.messages,
      ...(input.tools ? { tools: input.tools } : {}),
    }),
  });
}

async function runToolLoop(input: {
  model: string;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
  toolContext?: AgentToolExecutionContext;
  mode?: "talk" | "default";
}): Promise<OpenAiChatMessage[]> {
  const conversation: OpenAiChatMessage[] = [
    { role: "system", content: input.systemPrompt },
    ...input.messages.map(
      (message): OpenAiChatMessage => ({
        role: message.role,
        content: message.content,
      }),
    ),
  ];

  if (!input.toolContext) {
    return conversation;
  }

  const toolDefinitions =
    input.mode === "talk"
      ? TALK_AGENT_TOOL_DEFINITIONS
      : AGENT_TOOL_DEFINITIONS;
  const maxIterations =
    input.mode === "talk" ? MAX_TOOL_ITERATIONS_TALK : MAX_TOOL_ITERATIONS;
  const toolLoopStartedAt = performance.now();

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const response = await callOpenAiChat({
      model: input.model,
      messages: conversation,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      tools: toolDefinitions,
      stream: false,
    });

    if (!response.ok) {
      throw new Error(`OpenAI tool loop failed with status ${response.status}`);
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
      const result = await executeAgentTool({
        toolName: toolCall.function.name,
        argumentsJson: toolCall.function.arguments,
        context: input.toolContext,
      });

      conversation.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.content,
      });
    }
  }

  logTalkPerf("talk.brain.tool_loop", {
    mode: input.mode ?? "default",
    duration_ms: Math.round(performance.now() - toolLoopStartedAt),
  });

  return conversation;
}

export async function* streamTalkBrainResponse(input: {
  model: string;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
  toolContext?: AgentToolExecutionContext;
  mode?: "talk" | "default";
}): AsyncGenerator<string> {
  const conversation = await runToolLoop(input);
  const streamStartedAt = performance.now();
  let firstTokenLogged = false;
  const response = await callOpenAiChat({
    model: input.model,
    messages: conversation,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    stream: true,
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenAI stream failed with status ${response.status}`);
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
        if (!firstTokenLogged) {
          firstTokenLogged = true;
          logTalkPerf("talk.brain.ttfb", {
            mode: input.mode ?? "default",
            duration_ms: Math.round(performance.now() - streamStartedAt),
          });
        }
        yield content;
      }
    }
  }
}

export async function collectTalkBrainResponse(
  input: Parameters<typeof streamTalkBrainResponse>[0],
): Promise<string> {
  let reply = "";

  for await (const chunk of streamTalkBrainResponse(input)) {
    reply += chunk;
  }

  const trimmed = reply.trim();
  if (!trimmed) {
    throw new Error("OpenAI returned an empty response");
  }

  return trimmed;
}
