"use server";

import { headers } from "next/headers";
import { callBrainChat } from "@/features/brain/lib/brain-chat-transport";
import { resolveBrainApiConfig } from "@/features/brain/lib/resolve-brain-api-config";
import type { BrainProvider } from "@/entities/digital-employee";
import { hasOpenAiCredentials } from "@/shared/config/provider-env";
import { hasNullxesApiCredentials } from "@/shared/nullxes-sdk";
import { checkRateLimit } from "@/shared/security/rate-limit";
import { findFaqAnswer } from "./docs-faq";
import { buildDocsAssistantSystemPrompt } from "./docs-assistant-system-prompt";
import { retrieveDocsContext } from "./docs-corpus";

type DocsAnswerResult =
  | {
      ok: true;
      answer: string;
      source: "llm" | "faq";
      model?: string;
      citations: string[];
    }
  | { ok: false; answer: string };

export type DocsChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const DOCS_ASSISTANT_RATE_LIMIT = 10;
const DOCS_ASSISTANT_WINDOW_MS = 60_000;
const DOCS_PRIMARY_MODEL = "gpt-4o";

async function resolveDocsRateLimitKey(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "anonymous";
  }
  return headerStore.get("x-real-ip")?.trim() || "anonymous";
}

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

function extractCitations(answer: string, fallbackHrefs: string[]): string[] {
  const fromAnswer = Array.from(
    answer.matchAll(/\]\((\/docs(?:\/[a-z0-9\-/#]+)?)\)/gi),
  ).map((match) => match[1]!);
  const unique = [...new Set([...fromAnswer, ...fallbackHrefs])];
  return unique.slice(0, 6);
}

async function askLlm(input: {
  provider: BrainProvider;
  model: string;
  question: string;
  history: DocsChatTurn[];
  systemPrompt: string;
}): Promise<string | null> {
  const api = await resolveBrainApiConfig({
    provider: input.provider,
    configuredModel: input.model,
  });

  const historyMessages = input.history
    .slice(-6)
    .map((turn) => ({
      role: turn.role,
      content: turn.content,
    }));

  const response = await callBrainChat({
    api,
    messages: [
      { role: "system", content: input.systemPrompt },
      ...historyMessages,
      { role: "user", content: input.question },
    ],
    temperature: 0.2,
    maxTokens: 1200,
    stream: false,
  });

  return readCompletionText(response);
}

export async function answerDocsQuestionAction(input: {
  question: string;
  history?: DocsChatTurn[];
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

  const rateLimit = await checkRateLimit({
    name: "docs-assistant",
    key: await resolveDocsRateLimitKey(),
    limit: DOCS_ASSISTANT_RATE_LIMIT,
    windowMs: DOCS_ASSISTANT_WINDOW_MS,
  });

  if (!rateLimit.ok) {
    return {
      ok: false,
      answer: "Слишком много запросов. Подождите минуту и попробуйте снова.",
    };
  }

  const retrieved = retrieveDocsContext(question, 5);
  const systemPrompt = buildDocsAssistantSystemPrompt(retrieved);
  const citationFallback = retrieved.map((chunk) => chunk.href);

  // Prefer real OpenAI GPT-4o for the documentation portal.
  const llmAttempts: Array<{ provider: BrainProvider; model: string }> = [];
  if (hasOpenAiCredentials()) {
    llmAttempts.push({ provider: "openai", model: DOCS_PRIMARY_MODEL });
  }
  if (hasNullxesApiCredentials()) {
    llmAttempts.push({ provider: "nullxes", model: "nullxes-brain-v1" });
  }

  for (const attempt of llmAttempts) {
    try {
      const answer = await askLlm({
        provider: attempt.provider,
        model: attempt.model,
        question,
        history: input.history ?? [],
        systemPrompt,
      });
      if (answer) {
        return {
          ok: true,
          answer,
          source: "llm",
          model: attempt.model,
          citations: extractCitations(answer, citationFallback),
        };
      }
    } catch {
      // Try next provider / fall through to FAQ.
    }
  }

  const faq = findFaqAnswer(question);
  if (faq) {
    return {
      ok: true,
      answer: `${faq.answer}\n\nСм. также: ${citationFallback.slice(0, 3).join(", ")}`,
      source: "faq",
      citations: citationFallback.slice(0, 3),
    };
  }

  return {
    ok: false,
    answer:
      "Сейчас не удалось получить ответ GPT-4o. Откройте /docs/troubleshooting или напишите ceo@nullxes.com · Telegram @MagistrTheOne.",
  };
}
