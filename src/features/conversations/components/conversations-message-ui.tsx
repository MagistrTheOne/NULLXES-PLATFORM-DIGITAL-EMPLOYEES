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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMessageContext } from "stream-chat-react";
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

function MessageAvatar({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Avatar size="sm" className="mt-0.5 shrink-0 bg-black">
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback className="rounded-full bg-black text-[10px] text-white/50">
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  );
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
        "conversations-message group mx-auto w-full max-w-3xl px-6 py-8",
        mine ? "conversations-message--mine" : "conversations-message--agent",
      )}
    >
      <div className="flex gap-4">
        <MessageAvatar imageUrl={avatarImage} name={senderLabel} />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              {senderLabel}
            </span>
            <time
              className="shrink-0 text-xs font-normal text-white/35 tabular-nums"
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
            <p className="whitespace-pre-wrap text-sm font-normal leading-relaxed text-white/85">
              {text}
            </p>
          ) : null}

          {!mine && text ? (
            <div className="mt-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 text-white/40 hover:bg-white/[0.04] hover:text-white/75"
                    onClick={() => {
                      void handleCopy();
                    }}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {copied ? tChat("copied") : tChat("copy")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 text-white/40 hover:bg-white/[0.04] hover:text-white/75"
                  >
                    <ThumbsUp className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("feedbackUp")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-8 text-white/40 hover:bg-white/[0.04] hover:text-white/75"
                  >
                    <ThumbsDown className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("feedbackDown")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={regenerating}
                    className="size-8 text-white/40 hover:bg-white/[0.04] hover:text-white/75 disabled:opacity-40"
                    onClick={() => {
                      void handleRegenerate();
                    }}
                  >
                    <RotateCcw
                      className={cn("size-3.5", regenerating && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{tChat("regenerate")}</TooltipContent>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
