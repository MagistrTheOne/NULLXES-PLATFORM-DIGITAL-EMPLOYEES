import { getOpenAiApiBaseUrl, getOpenAiApiKey } from "@/shared/config/provider-env";

export type TalkBrainMessage = {
  role: "user" | "assistant";
  content: string;
};

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export async function generateTalkBrainResponse(input: {
  model: string;
  systemPrompt: string;
  messages: TalkBrainMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
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
      messages: [
        { role: "system", content: input.systemPrompt },
        ...input.messages,
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI chat failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return text;
}
