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
import type { NullxesWorkspaceSurface } from "./types";

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

function NullxesMessageAvatar({
  imageUrl,
  name,
  compact,
}: {
  imageUrl?: string | null;
  name: string;
  compact?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Avatar
      size={compact ? "sm" : "sm"}
      className={cn("shrink-0 bg-black", compact ? "mt-0" : "mt-0.5")}
    >
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback className="rounded-full bg-black text-[10px] text-white/50">
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

export function NullxesMessageActions({
  text,
  messageId,
  compact,
}: {
  text: string;
  messageId?: string;
  compact?: boolean;
}) {
  const t = useTranslations("conversations");
  const tChat = useTranslations("employees.talk.chat");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

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
    if (!messageId || regenerating) {
      return;
    }
    setRegenerating(true);
    try {
      await regenerateTalkMessage(messageId);
    } finally {
      setRegenerating(false);
    }
  }, [messageId, regenerating]);

  if (compact) {
    return (
      <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => {
            void handleCopy();
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-white/45 transition-colors hover:bg-white/4 hover:text-white/75"
        >
          <Copy className="size-3" />
          {copied ? tChat("copied") : tChat("copy")}
        </button>
        <button
          type="button"
          disabled={regenerating}
          onClick={() => {
            void handleRegenerate();
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-white/45 transition-colors hover:bg-white/4 hover:text-white/75 disabled:opacity-40"
        >
          <RotateCcw
            className={cn("size-3", regenerating && "animate-spin")}
          />
          {tChat("regenerate")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-white/40 hover:bg-white/4 hover:text-white/75"
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
            className="size-8 text-white/40 hover:bg-white/4 hover:text-white/75"
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
            className="size-8 text-white/40 hover:bg-white/4 hover:text-white/75"
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
            className="size-8 text-white/40 hover:bg-white/4 hover:text-white/75 disabled:opacity-40"
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
  );
}

export function NullxesMessage({
  surface,
  agentDisplayName,
  viewerName,
  viewerImage,
}: {
  surface: NullxesWorkspaceSurface;
  agentDisplayName: string;
  viewerName?: string;
  viewerImage?: string | null;
}) {
  const tChat = useTranslations("employees.talk.chat");
  const { message, isMyMessage } = useMessageContext("NullxesMessage");

  const mine = isMyMessage();
  const youLabel = tChat("senderYou");
  const isTalk = surface === "talk";

  const senderLabel = mine
    ? isTalk
      ? youLabel
      : (viewerName ?? message.user?.name ?? youLabel)
    : isTalk
      ? agentDisplayName.toUpperCase()
      : (message.user?.name ?? agentDisplayName);

  const avatarImage = mine
    ? (viewerImage ?? message.user?.image)
    : message.user?.image;
  const avatarName = mine
    ? (viewerName ?? message.user?.name ?? youLabel)
    : (message.user?.name ?? agentDisplayName);

  const text = message.text?.trim() ?? "";
  const createdAt = message.created_at
    ? new Date(message.created_at)
    : undefined;

  if (message.type === "deleted" || message.deleted_at) {
    return null;
  }

  if (isTalk) {
    return (
      <article
        className={cn(
          "group border-b border-white/6 px-4 py-4",
          mine ? "nullxes-message--mine" : "nullxes-message--agent",
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <NullxesMessageAvatar
              imageUrl={avatarImage}
              name={avatarName}
              compact
            />
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {senderLabel}
            </span>
          </div>
          <time
            className="shrink-0 text-[10px] tabular-nums text-white/30"
            dateTime={createdAt?.toISOString()}
          >
            {formatMessageTime(createdAt)}
          </time>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
          {text}
        </p>

        {!mine && text ? (
          <NullxesMessageActions
            compact
            text={text}
            messageId={message.id}
          />
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group mx-auto w-full max-w-3xl px-6 py-8",
        mine ? "nullxes-message--mine" : "nullxes-message--agent",
      )}
    >
      <div className="flex gap-4">
        <NullxesMessageAvatar imageUrl={avatarImage} name={senderLabel} />

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              {senderLabel}
            </span>
            <time
              className="shrink-0 text-xs font-normal tabular-nums text-white/35"
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
            <NullxesMessageActions text={text} messageId={message.id} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
