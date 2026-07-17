const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type ResponsesOutputItem = {
  type?: string;
  result?: string | null;
  revised_prompt?: string | null;
  content?: Array<{ type?: string; text?: string }>;
};

/**
 * OpenAI Responses API `image_generation` tool.
 * @see https://developers.openai.com/api/docs/guides/tools-image-generation
 */
export async function generateImageOpenAi(input: {
  prompt: string;
  size?: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return "Image generation is not configured (OPENAI_API_KEY missing).";
  }

  const model =
    process.env.OPENAI_IMAGE_GEN_MODEL?.trim() ||
    process.env.OPENAI_WEB_SEARCH_MODEL?.trim() ||
    "gpt-4.1-mini";

  const tool: Record<string, unknown> = {
    type: "image_generation",
    action: "generate",
  };
  if (input.size?.trim()) {
    tool.size = input.size.trim();
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      tools: [tool],
      tool_choice: { type: "image_generation" },
      input: input.prompt,
    }),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorPayload = (await response.json()) as {
        error?: { message?: string };
      };
      detail = errorPayload.error?.message ?? detail;
    } catch {
      // ignore
    }
    return `Image generation failed (${response.status}): ${detail}`;
  }

  const payload = (await response.json()) as {
    output?: ResponsesOutputItem[];
  };

  const imageCall = (payload.output ?? []).find(
    (item) => item.type === "image_generation_call" && item.result,
  );

  if (!imageCall?.result) {
    return "Image generation returned no image.";
  }

  const revised = imageCall.revised_prompt?.trim();
  const markdown = `![generated image](data:image/png;base64,${imageCall.result})`;
  return [
    "Image generated successfully.",
    revised ? `Revised prompt: ${revised}` : null,
    markdown,
  ]
    .filter(Boolean)
    .join("\n\n");
}
