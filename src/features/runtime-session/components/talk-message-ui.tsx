"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, RotateCcw } from "lucide-react";
import { Avatar } from "stream-chat-react";
import { useMessageContext } from "stream-chat-react";
import { cn } from "@/lib/utils";
import { regenerateTalkMessage } from "../lib/talk-regenerate-bridge";

function formatMessageTime(value: Date | string | undefined): string {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function TalkMessageUI({
  agentDisplayName,
}: {
  agentDisplayName: string;
}) {
  const t = useTranslations("employees.talk.chat");
  const { message, isMyMessage } = useMessageContext("TalkMessageUI");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const mine = isMyMessage();
  const senderLabel = mine ? t("senderYou") : agentDisplayName.toUpperCase();
  const text = message.text?.trim() ?? "";
  const createdAt = message.created_at
    ? new Date(message.created_at)
    : undefined;

  const handleCopy = useCallback(async () => {
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable.
    }
  }, [text]);

  const handleRegenerate = useCallback(async () => {
    if (!message.id || regenerating) {
      return;
    }
    setRegenerating(true);
    try {
      await regenerateTalkMessage(message.id);
    } finally {
      setRegenerating(false);
    }
  }, [message.id, regenerating]);

  if (message.type === "deleted" || message.deleted_at) {
    return null;
  }

  return (
    <article
      className={cn(
        "talk-message group border-b border-white/6 px-4 py-4",
        mine ? "talk-message--mine" : "talk-message--agent",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {!mine ? (
            <Avatar
              imageUrl={message.user?.image}
              userName={message.user?.name ?? agentDisplayName}
              size="sm"
            />
          ) : null}
          <span className="truncate text-[10px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            {senderLabel}
          </span>
        </div>
        <time
          className="shrink-0 text-[10px] text-white/30 tabular-nums"
          dateTime={createdAt?.toISOString()}
        >
          {formatMessageTime(createdAt)}
        </time>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
        {text}
      </p>

      {!mine && text ? (
        <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-white/45 transition-colors hover:bg-white/6 hover:text-white/75"
          >
            <Copy className="size-3" />
            {copied ? t("copied") : t("copy")}
          </button>
          <button
            type="button"
            disabled={regenerating}
            onClick={() => {
              void handleRegenerate();
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-white/45 transition-colors hover:bg-white/6 hover:text-white/75 disabled:opacity-40"
          >
            <RotateCcw
              className={cn("size-3", regenerating && "animate-spin")}
            />
            {t("regenerate")}
          </button>
        </div>
      ) : null}
    </article>
  );
}
