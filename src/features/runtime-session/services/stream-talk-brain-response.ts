import { getOpenAiApiBaseUrl, getOpenAiApiKey } from "@/shared/config/provider-env";
import type { TalkBrainMessage } from "./generate-talk-brain-response";

type OpenAiStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
  }>;
};

export async function* streamTalkBrainResponse(input: {
  model: string;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
}): AsyncGenerator<string> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(`${getOpenAiApiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 1024,
      stream: true,
      messages: [
        { role: "system", content: input.systemPrompt },
        ...input.messages,
      ],
    }),
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
