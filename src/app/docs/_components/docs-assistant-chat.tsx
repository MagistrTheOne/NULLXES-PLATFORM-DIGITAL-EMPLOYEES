"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answerDocsQuestionAction } from "../_lib/answer-docs-question";
import { DOCS_FAQ } from "../_lib/docs-faq";
import type { DocsAssistantProfile } from "../_lib/get-docs-assistant";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const WELCOME =
  "Привет! Я Yuki Nakora — документационный ассистент NULLXES Digital Employees. Отвечаю через LLM по материалам /docs (установка, эксплуатация, миссии, 152-ФЗ). Выберите тему ниже или задайте свой вопрос.";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random()}`, role, content };
}

export function DocsAssistantChat({
  assistant,
  compact = false,
}: {
  assistant: DocsAssistantProfile;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", WELCOME),
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isPending) {
      return;
    }

    setMessages((current) => [...current, createMessage("user", trimmed)]);
    setInput("");

    startTransition(async () => {
      const result = await answerDocsQuestionAction({ question: trimmed });
      setMessages((current) => [
        ...current,
        createMessage("assistant", result.answer),
      ]);
    });
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border border-white/10 bg-[#111111] ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Avatar size="lg">
          {assistant.avatarUrl ? (
            <AvatarImage src={assistant.avatarUrl} alt={assistant.name} />
          ) : null}
          <AvatarFallback className="bg-white/10 text-white/80">
            {assistant.initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-white">{assistant.name}</p>
          <p className="text-xs text-white/45">Документация · LLM</p>
        </div>
      </div>

      <div
        className={`mt-4 flex flex-col gap-3 overflow-y-auto ${
          compact ? "max-h-72" : "min-h-[320px] max-h-[480px]"
        }`}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed ${
              message.role === "assistant"
                ? "self-start bg-white/5 text-white/75"
                : "self-end bg-white/10 text-white"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isPending ? (
          <div className="self-start rounded-xl bg-white/5 px-3 py-2 text-sm text-white/45">
            Готовлю ответ…
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {DOCS_FAQ.slice(0, compact ? 4 : 6).map((entry) => (
          <button
            key={entry.id}
            type="button"
            disabled={isPending}
            onClick={() => ask(entry.question)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-45"
          >
            {entry.question}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Вопрос по документации…"
          disabled={isPending}
          className="border-white/10 bg-black text-white placeholder:text-white/35"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isPending || input.trim().length === 0}
          className="shrink-0 bg-white text-black hover:bg-white/90"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
