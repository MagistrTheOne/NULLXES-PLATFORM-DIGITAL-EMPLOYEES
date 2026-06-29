"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import { useChannelStateContext } from "stream-chat-react";

export function NullxesEmptyState({
  message,
  agentName,
  agentRole,
  showSuggestions = false,
}: {
  message: string;
  agentName?: string;
  agentRole?: string;
  showSuggestions?: boolean;
}) {
  const t = useTranslations("conversations");
  const { channel } = useChannelStateContext("NullxesEmptyState");
  const [sending, setSending] = useState(false);

  const suggestions = showSuggestions
    ? (t.raw("suggestions") as string[] | undefined)
    : undefined;

  if (!showSuggestions || !suggestions || suggestions.length === 0) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-4 px-8 text-center">
        <MessageSquare className="size-10 stroke-[1.25] text-white/20" />
        <p className="max-w-sm text-sm font-normal leading-relaxed text-white/45">
          {message}
        </p>
      </div>
    );
  }

  const handleSuggestion = async (text: string) => {
    if (!channel || sending) {
      return;
    }
    setSending(true);
    try {
      await channel.sendMessage({ text });
    } catch {
      // The composer remains available for a manual retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        {agentName ? (
          <h2 className="text-xl font-medium tracking-tight text-white">
            {agentName}
          </h2>
        ) : null}
        {agentRole ? (
          <p className="text-sm font-normal text-white/45">{agentRole}</p>
        ) : null}
        <p className="mt-3 text-sm font-normal text-white/55">
          {t("emptyPrompt")}
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={sending || !channel}
            onClick={() => {
              void handleSuggestion(suggestion);
            }}
            className="rounded-xl border border-white/8 bg-white/1.5 px-4 py-3 text-left text-sm font-normal text-white/70 transition-colors hover:border-white/15 hover:bg-white/4 hover:text-white disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
