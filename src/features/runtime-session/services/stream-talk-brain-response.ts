import {
  AGENT_TOOL_DEFINITIONS,
  TALK_AGENT_TOOL_DEFINITIONS,
  type AgentToolDefinition,
  executeAgentTool,
  type AgentToolExecutionContext,
} from "@/features/agent-tools";
import type { BrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { resolveBrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { getBrainFailoverProvider } from "@/features/brain/lib/get-brain-failover-provider";
import { formatBrainModelDisplay } from "@/features/brain/lib/format-brain-model-display";
import { logTalkPerf } from "@/features/runtime-session/lib/talk-perf-log";
import { logServerEvent } from "@/shared/lib/server-log";
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
  | {
      type: "perf";
      spans: Partial<Record<"ttfb" | "tool_loop", number>>;
    }
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
      const detail = await readBrainError(response);
      throw new Error(
        `Brain tool loop failed with status ${response.status}: ${detail}`,
      );
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

  const toolLoopMs = Math.round(performance.now() - toolLoopStartedAt);
  if (toolLoopMs > 0 && input.mode === "talk") {
    yield { type: "perf", spans: { tool_loop: toolLoopMs } };
  }

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
  let api = await resolveTalkBrainApi({
    brainProvider: input.brainProvider,
    model: input.model,
    organizationId: input.toolContext?.organizationId,
  });

  yield brainMetaEvent(api);

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

  const streamResult = await openBrainChatStream({
    api,
    brainProvider: input.brainProvider,
    model: input.model,
    organizationId: input.toolContext?.organizationId,
    messages: conversation,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    responseFormat: input.responseFormat,
  });

  if (streamResult.api.provider !== api.provider) {
    api = streamResult.api;
    yield brainMetaEvent(api);
  }

  const response = streamResult.response;

  const reader = response.body!.getReader();
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
          const ttfbMs = Math.round(performance.now() - streamStartedAt);
          logTalkPerf("talk.brain.ttfb", {
            mode: input.mode ?? "default",
            provider: api.provider,
            duration_ms: ttfbMs,
          });
          if (input.mode === "talk") {
            yield { type: "perf", spans: { ttfb: ttfbMs } };
          }
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

async function resolveTalkBrainApi(input: {
  brainProvider: BrainProvider;
  model: string;
  organizationId?: string;
}): Promise<BrainApiConfig> {
  try {
    return await resolveBrainApiConfig({
      provider: input.brainProvider,
      configuredModel: input.model,
      organizationId: input.organizationId,
    });
  } catch (primaryError: unknown) {
    const fallback = getBrainFailoverProvider(input.brainProvider);
    if (!fallback) {
      throw primaryError;
    }

    logServerEvent("talk.brain.failover", {
      from: input.brainProvider,
      to: fallback,
      phase: "resolve",
    });

    return resolveBrainApiConfig({
      provider: fallback,
      configuredModel: input.model,
      organizationId: input.organizationId,
    });
  }
}

function brainMetaEvent(api: BrainApiConfig): TalkBrainStreamEvent {
  return {
    type: "meta",
    brainProvider: api.provider,
    model: api.model,
    modelLabel: formatBrainModelDisplay({
      provider: api.provider,
      modelId: api.model,
    }),
  };
}

async function openBrainChatStream(input: {
  api: BrainApiConfig;
  brainProvider: BrainProvider;
  model: string;
  organizationId?: string;
  messages: OpenAiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}): Promise<{ api: BrainApiConfig; response: Response }> {
  let api = input.api;
  let response = await callBrainChat({
    api,
    messages: input.messages,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    stream: true,
    responseFormat: input.responseFormat,
  });

  if (response.ok && response.body) {
    return { api, response };
  }

  const detail = await readBrainError(response);
  const fallback = getBrainFailoverProvider(api.provider);
  if (!fallback) {
    throw new Error(
      `Brain stream failed with status ${response.status}: ${detail}`,
    );
  }

  logServerEvent("talk.brain.failover", {
    from: api.provider,
    to: fallback,
    phase: "stream",
    status: response.status,
  });

  api = await resolveBrainApiConfig({
    provider: fallback,
    configuredModel: input.model,
    organizationId: input.organizationId,
  });

  response = await callBrainChat({
    api,
    messages: input.messages,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    stream: true,
    responseFormat: input.responseFormat,
  });

  if (!response.ok || !response.body) {
    const fallbackDetail = await readBrainError(response);
    throw new Error(
      `Brain stream failed with status ${response.status}: ${fallbackDetail}`,
    );
  }

  return { api, response };
}

async function readBrainError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return response.statusText;
  }
}

async function collectStructuredTalkBrainResponse(input: {
  brainProvider: BrainProvider;
  model: string;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}): Promise<string> {
  let api = await resolveTalkBrainApi({
    brainProvider: input.brainProvider,
    model: input.model,
  });

  const conversation: OpenAiChatMessage[] = [
    { role: "system", content: input.systemPrompt },
    ...input.messages.map(
      (message): OpenAiChatMessage => ({
        role: message.role,
        content: message.content,
      }),
    ),
  ];

  // vLLM / NULLXES brain often rejects response_format; prompt + JSON parser handle output.
  const responseFormat =
    input.responseFormat && api.provider !== "nullxes"
      ? input.responseFormat
      : undefined;

  let response = await callBrainChat({
    api,
    messages: conversation,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    stream: false,
    responseFormat,
  });

  if (!response.ok) {
    const detail = await readBrainError(response);
    const fallback = getBrainFailoverProvider(api.provider);
    if (fallback) {
      logServerEvent("talk.brain.failover", {
        from: api.provider,
        to: fallback,
        phase: "structured",
        status: response.status,
      });
      api = await resolveBrainApiConfig({
        provider: fallback,
        configuredModel: input.model,
      });
      response = await callBrainChat({
        api,
        messages: conversation,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        stream: false,
        responseFormat:
          input.responseFormat && api.provider !== "nullxes"
            ? input.responseFormat
            : undefined,
      });
    }
  }

  if (!response.ok) {
    const detail = await readBrainError(response);
    throw new Error(
      `Brain request failed with status ${response.status}: ${detail}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: OpenAiCompletionMessage }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";

  if (!content) {
    throw new Error("Brain returned an empty response");
  }

  return content;
}

export async function collectTalkBrainResponse(
  input: Parameters<typeof streamTalkBrainResponse>[0],
): Promise<string> {
  if (input.responseFormat) {
    return collectStructuredTalkBrainResponse(input);
  }

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
