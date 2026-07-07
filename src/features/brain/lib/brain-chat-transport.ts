import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import type { BrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import { buildBrainChatTokenLimit } from "@/features/brain/lib/build-brain-chat-token-limit";
import { getNullxesSdkClient } from "@/shared/nullxes-sdk";
import { getOpenAiApiBaseUrl } from "@/shared/config/provider-env";
import type {
  BrainChatMessage,
  BrainChatRequest,
  OpenAiCompletionPayload,
} from "./brain-chat-types";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function openAiSseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function encodeSseChunk(content: string): Uint8Array {
  const payload = JSON.stringify({
    choices: [{ delta: { content } }],
  });
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

function splitSystemAndMessages(messages: BrainChatMessage[]): {
  system?: string;
  conversation: BrainChatMessage[];
} {
  const systemParts: string[] = [];
  const conversation: BrainChatMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
      continue;
    }
    conversation.push(message);
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    conversation,
  };
}

function toAnthropicMessages(messages: BrainChatMessage[]): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const message of messages) {
    if (message.role === "user") {
      result.push({ role: "user", content: message.content });
      continue;
    }

    if (message.role === "assistant") {
      if ("tool_calls" in message && message.tool_calls?.length) {
        result.push({
          role: "assistant",
          content: message.tool_calls.map((toolCall) => ({
            type: "tool_use" as const,
            id: toolCall.id,
            name: toolCall.function.name,
            input: safeJsonParse(toolCall.function.arguments),
          })),
        });
        continue;
      }

      if (message.content) {
        result.push({ role: "assistant", content: message.content });
      }
      continue;
    }

    if (message.role === "tool") {
      result.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: message.tool_call_id,
            content: message.content,
          },
        ],
      });
    }
  }

  return result;
}

function toGoogleContents(messages: BrainChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: message.content ?? "" }],
    }));
}

function safeJsonParse(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function toAnthropicTools(
  tools: BrainChatRequest["tools"],
): Anthropic.Tool[] | undefined {
  if (!tools?.length) {
    return undefined;
  }

  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: {
      type: "object",
      ...tool.function.parameters,
    } as Anthropic.Tool.InputSchema,
  }));
}

async function callOpenAiCompatibleChat(
  api: BrainApiConfig,
  request: BrainChatRequest,
): Promise<Response> {
  const body = {
    model: request.model,
    temperature: request.temperature ?? 0.7,
    ...buildBrainChatTokenLimit(request.model, request.maxTokens ?? 1024),
    stream: request.stream ?? false,
    messages: request.messages,
    ...(request.tools ? { tools: request.tools } : {}),
    ...(request.responseFormat
      ? { response_format: request.responseFormat }
      : {}),
  };

  if (api.provider === "nullxes") {
    const client = getNullxesSdkClient();
    if (!client) {
      throw new Error("NULLXES API is not configured");
    }

    return client.chatCompletions({
      model: request.model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content:
          message.role === "tool"
            ? message.content
            : "content" in message
              ? (message.content ?? "")
              : "",
        ...(message.role === "tool"
          ? { tool_call_id: message.tool_call_id }
          : {}),
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: request.stream,
      tools: request.tools,
      response_format: request.responseFormat,
    });
  }

  return fetch(`${api.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${api.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function callAnthropicChat(
  api: BrainApiConfig,
  request: BrainChatRequest,
): Promise<Response> {
  const client = new Anthropic({ apiKey: api.apiKey });
  const { system, conversation } = splitSystemAndMessages(request.messages);
  const messages = toAnthropicMessages(conversation);

  if (request.stream) {
    const stream = await client.messages.stream({
      model: request.model,
      system,
      messages,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature,
      tools: toAnthropicTools(request.tools),
    });

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta" &&
              event.delta.text
            ) {
              controller.enqueue(encodeSseChunk(event.delta.text));
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return openAiSseResponse(body);
  }

  const response = await client.messages.create({
    model: request.model,
    system,
    messages,
    max_tokens: request.maxTokens ?? 1024,
    temperature: request.temperature,
    tools: toAnthropicTools(request.tools),
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const toolCalls = response.content
    .filter((block) => block.type === "tool_use")
    .map((block) => ({
      id: block.id,
      type: "function" as const,
      function: {
        name: block.name,
        arguments: JSON.stringify(block.input ?? {}),
      },
    }));

  const payload: OpenAiCompletionPayload = {
    choices: [
      {
        message: {
          role: "assistant",
          content: text || null,
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: toolCalls.length ? "tool_calls" : "stop",
      },
    ],
  };

  return jsonResponse(payload);
}

async function callGoogleChat(
  api: BrainApiConfig,
  request: BrainChatRequest,
): Promise<Response> {
  const client = new GoogleGenAI({ apiKey: api.apiKey });
  const { system, conversation } = splitSystemAndMessages(request.messages);
  const contents = toGoogleContents(conversation);

  if (request.stream) {
    const stream = await client.models.generateContentStream({
      model: request.model,
      contents,
      config: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        ...(system ? { systemInstruction: system } : {}),
        ...(request.responseFormat?.type === "json_object"
          ? { responseMimeType: "application/json" }
          : {}),
      },
    });

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encodeSseChunk(text));
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return openAiSseResponse(body);
  }

  const response = await client.models.generateContent({
    model: request.model,
    contents,
    config: {
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
      ...(system ? { systemInstruction: system } : {}),
      ...(request.responseFormat?.type === "json_object"
        ? { responseMimeType: "application/json" }
        : {}),
    },
  });

  const payload: OpenAiCompletionPayload = {
    choices: [
      {
        message: {
          role: "assistant",
          content: response.text ?? "",
        },
        finish_reason: "stop",
      },
    ],
  };

  return jsonResponse(payload);
}

export async function callBrainChat(input: {
  api: BrainApiConfig;
  messages: BrainChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: BrainChatRequest["tools"];
  stream?: boolean;
  responseFormat?: { type: "json_object" };
}): Promise<Response> {
  const request: BrainChatRequest = {
    model: input.api.model,
    messages: input.messages,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    tools: input.tools,
    stream: input.stream,
    responseFormat: input.responseFormat,
  };

  switch (input.api.transport) {
    case "anthropic":
      return callAnthropicChat(input.api, request);
    case "google":
      return callGoogleChat(input.api, request);
    case "openai-compatible":
    default:
      return callOpenAiCompatibleChat(input.api, request);
  }
}

export function getOpenAiCompatibleBaseUrl(): string {
  return getOpenAiApiBaseUrl().replace(/\/$/, "");
}
