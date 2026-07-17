const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type ResponsesOutputItem = {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
};

function extractResponseText(payload: {
  output_text?: string;
  output?: ResponsesOutputItem[];
}): string {
  if (payload.output_text?.trim()) {
    return payload.output_text.trim();
  }

  for (const item of payload.output ?? []) {
    if (item.type !== "message") {
      continue;
    }

    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text?.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
}

/**
 * Vision via Responses API multimodal input.
 * @see https://developers.openai.com/api/docs/guides/images-vision
 */
export async function analyzeImageOpenAi(input: {
  imageUrl: string;
  question: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return "Vision is not configured (OPENAI_API_KEY missing).";
  }

  const model =
    process.env.OPENAI_VISION_MODEL?.trim() ||
    process.env.OPENAI_WEB_SEARCH_MODEL?.trim() ||
    "gpt-4.1-mini";

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: input.question },
            {
              type: "input_image",
              image_url: input.imageUrl,
              detail: "auto",
            },
          ],
        },
      ],
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
    return `Vision analysis failed (${response.status}): ${detail}`;
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: ResponsesOutputItem[];
  };

  const text = extractResponseText(payload);
  return text || "Vision analysis returned no description.";
}
