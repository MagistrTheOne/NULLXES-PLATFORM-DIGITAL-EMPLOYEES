"use server";

import { callBrainChat } from "@/features/brain/lib/brain-chat-transport";
import { resolveBrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import type { BrainProvider } from "@/entities/digital-employee";
import { hasOpenAiCredentials } from "@/shared/config/provider-env";
import { hasNullxesApiCredentials } from "@/shared/nullxes-sdk";
import { findFaqAnswer } from "./docs-faq";
import { buildDocsAssistantSystemPrompt } from "./docs-assistant-system-prompt";

type DocsAnswerResult =
  | { ok: true; answer: string; source: "llm" | "faq" }
  | { ok: false; answer: string };

async function readCompletionText(response: Response): Promise<string | null> {
  if (!response.ok) {
    return null;
  }

  try {
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch {
    return null;
  }
}

async function askLlm(input: {
  provider: BrainProvider;
  model: string;
  question: string;
}): Promise<string | null> {
  const api = await resolveBrainApiConfig({
    provider: input.provider,
    configuredModel: input.model,
  });

  const response = await callBrainChat({
    api,
    messages: [
      { role: "system", content: buildDocsAssistantSystemPrompt() },
      { role: "user", content: input.question },
    ],
    temperature: 0.2,
    maxTokens: 900,
    stream: false,
  });

  return readCompletionText(response);
}

export async function answerDocsQuestionAction(input: {
  question: string;
}): Promise<DocsAnswerResult> {
  const question = input.question.trim();
  if (!question) {
    return {
      ok: false,
      answer: "Задайте вопрос по документации NULLXES Digital Employees.",
    };
  }

  if (question.length > 2000) {
    return {
      ok: false,
      answer: "Вопрос слишком длинный. Сократите до 2000 символов.",
    };
  }

  const llmAttempts: Array<{ provider: BrainProvider; model: string }> = [];
  if (hasNullxesApiCredentials()) {
    llmAttempts.push({ provider: "nullxes", model: "nullxes-brain-v1" });
  }
  if (hasOpenAiCredentials()) {
    llmAttempts.push({ provider: "openai", model: "gpt-4o-mini" });
  }

  for (const attempt of llmAttempts) {
    try {
      const answer = await askLlm({
        provider: attempt.provider,
        model: attempt.model,
        question,
      });
      if (answer) {
        return { ok: true, answer, source: "llm" };
      }
    } catch {
      // Try next provider / fall through to FAQ.
    }
  }

  const faq = findFaqAnswer(question);
  if (faq) {
    return { ok: true, answer: faq.answer, source: "faq" };
  }

  return {
    ok: false,
    answer:
      "Сейчас не удалось получить ответ модели. Откройте /docs или /docs/personal-data, либо напишите ceo@nullxes.com · Telegram @MagistrTheOne.",
  };
}
