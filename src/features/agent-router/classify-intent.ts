import { getOpenAiApiBaseUrl, getOpenAiApiKey } from "@/shared/config/provider-env";

export type AgentIntent =
  | "answer_question"
  | "research"
  | "schedule_followup"
  | "handoff"
  | "destructive_action";

export type IntentClassification = {
  intent: AgentIntent;
  confidence: number;
  suggestedWorkflow: string;
};

export async function classifyIntent(input: {
  message: string;
  employeeRole: string;
}): Promise<IntentClassification> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return {
      intent: "answer_question",
      confidence: 0.5,
      suggestedWorkflow: "default_brain",
    };
  }

  const response = await fetch(`${getOpenAiApiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Classify the task intent. Return JSON: { "intent": "answer_question"|"research"|"schedule_followup"|"handoff"|"destructive_action", "confidence": number, "suggestedWorkflow": string }.',
        },
        {
          role: "user",
          content: `Employee role: ${input.employeeRole}\nTask:\n${input.message}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return {
      intent: "answer_question",
      confidence: 0.5,
      suggestedWorkflow: "default_brain",
    };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return {
      intent: "answer_question",
      confidence: 0.5,
      suggestedWorkflow: "default_brain",
    };
  }

  const parsed = JSON.parse(content) as IntentClassification;
  return {
    intent: parsed.intent ?? "answer_question",
    confidence: parsed.confidence ?? 0.5,
    suggestedWorkflow: parsed.suggestedWorkflow ?? "default_brain",
  };
}
