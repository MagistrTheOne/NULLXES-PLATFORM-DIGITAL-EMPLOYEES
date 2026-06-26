"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCheck,
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Avatar, useMessageContext } from "stream-chat-react";
import { cn } from "@/lib/utils";
import { regenerateTalkMessage } from "@/features/runtime-session/lib/talk-regenerate-bridge";

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

export function ConversationsMessageUI({
  agentDisplayName,
  viewerName,
  viewerImage,
}: {
  agentDisplayName: string;
  viewerName?: string;
  viewerImage?: string | null;
}) {
  const t = useTranslations("conversations");
  const tChat = useTranslations("employees.talk.chat");
  const { message, isMyMessage } = useMessageContext("ConversationsMessageUI");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const mine = isMyMessage();
  const youLabel = tChat("senderYou");
  const senderLabel = mine
    ? (viewerName ?? message.user?.name ?? youLabel)
    : (message.user?.name ?? agentDisplayName);
  const avatarImage = mine
    ? (viewerImage ?? message.user?.image)
    : message.user?.image;
  const avatarName = senderLabel;
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
        "conversations-message group px-5 py-3",
        mine ? "conversations-message--mine" : "conversations-message--agent",
      )}
    >
      <div className="flex gap-3">
        <Avatar
          imageUrl={avatarImage ?? undefined}
          userName={avatarName}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="truncate text-xs font-medium text-white/90">
              {senderLabel}
            </span>
            <time
              className="shrink-0 text-[10px] text-white/35 tabular-nums"
              dateTime={createdAt?.toISOString()}
            >
              {formatMessageTime(createdAt)}
            </time>
            {mine ? (
              <CheckCheck
                className="ml-auto size-3.5 shrink-0 text-white/35"
                aria-hidden
              />
            ) : null}
          </div>

          {text ? (
            <div
              className={cn(
                "conversations-message-bubble inline-block max-w-[min(560px,100%)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-white/88",
                mine ? "bg-white/10" : "bg-white/[0.05]",
              )}
            >
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          ) : null}

          {!mine && text ? (
            <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => {
                  void handleCopy();
                }}
                className="inline-flex size-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/6 hover:text-white/75"
                aria-label={copied ? tChat("copied") : tChat("copy")}
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/6 hover:text-white/75"
                aria-label={t("feedbackUp")}
              >
                <ThumbsUp className="size-3.5" />
              </button>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/6 hover:text-white/75"
                aria-label={t("feedbackDown")}
              >
                <ThumbsDown className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={regenerating}
                onClick={() => {
                  void handleRegenerate();
                }}
                className="inline-flex size-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/6 hover:text-white/75 disabled:opacity-40"
                aria-label={tChat("regenerate")}
              >
                <RotateCcw
                  className={cn("size-3.5", regenerating && "animate-spin")}
                />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
