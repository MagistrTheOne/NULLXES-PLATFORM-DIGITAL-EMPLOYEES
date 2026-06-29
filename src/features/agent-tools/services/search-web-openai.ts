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

/** OpenAI Responses API web_search — https://developers.openai.com/api/docs/guides/tools-web-search */
export async function searchWebOpenAi(query: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return "Web search is not configured (OPENAI_API_KEY missing).";
  }

  const model =
    process.env.OPENAI_WEB_SEARCH_MODEL?.trim() || "gpt-4.1-mini";

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      tools: [{ type: "web_search", search_context_size: "low" }],
      tool_choice: "auto",
      input: query,
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
    return `Web search failed (${response.status}): ${detail}`;
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: ResponsesOutputItem[];
  };

  const text = extractResponseText(payload);
  return text || "Web search returned no results.";
}
