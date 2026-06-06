import { getOpenAiApiBaseUrl, getOpenAiApiKey } from "@/shared/config/provider-env";

export type SessionSummaryResult = {
  summary: string;
  primaryTopic: string;
  resolved: boolean;
  followUps: Array<{ title: string; description: string; dueInHours?: number }>;
};

export async function summarizeSessionTranscript(input: {
  employeeName: string;
  employeeRole: string;
  transcript: Array<{ role: string; content: string }>;
}): Promise<SessionSummaryResult | null> {
  if (input.transcript.length === 0) {
    return null;
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const formattedTranscript = input.transcript
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n");

  const response = await fetch(`${getOpenAiApiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Summarize the talk session. Return JSON with keys: summary (string), primaryTopic (string), resolved (boolean), followUps (array of {title, description, dueInHours}).",
        },
        {
          role: "user",
          content: `Employee: ${input.employeeName} (${input.employeeRole})\n\nTranscript:\n${formattedTranscript}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Session summary failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  const parsed = JSON.parse(content) as SessionSummaryResult;
  return {
    summary: parsed.summary?.trim() ?? "",
    primaryTopic: parsed.primaryTopic?.trim() ?? "General",
    resolved: Boolean(parsed.resolved),
    followUps: Array.isArray(parsed.followUps) ? parsed.followUps : [],
  };
}
