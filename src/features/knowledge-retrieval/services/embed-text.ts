import {
  getOpenAiApiBaseUrl,
  getOpenAiApiKey,
  getOpenAiEmbeddingDimensions,
  getOpenAiEmbeddingModel,
} from "@/shared/config/provider-env";
import type { EmbedTextsInput } from "../types";

type OpenAiEmbeddingResponse = {
  data: Array<{ embedding: number[]; index: number }>;
};

export async function embedTexts(input: EmbedTextsInput): Promise<number[][]> {
  if (input.texts.length === 0) {
    return [];
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = getOpenAiEmbeddingModel();
  const dimensions = getOpenAiEmbeddingDimensions();

  const response = await fetch(`${getOpenAiApiBaseUrl()}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: input.texts,
      dimensions,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OpenAiEmbeddingResponse;
  return payload.data
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.embedding);
}
