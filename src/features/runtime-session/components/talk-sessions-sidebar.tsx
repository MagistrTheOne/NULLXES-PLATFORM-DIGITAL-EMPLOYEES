"use client";

import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TalkThreadSummary } from "../actions/list-talk-threads";

export type TalkThreadItem = TalkThreadSummary;

function formatThreadTime(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const sameDay = new Date().toDateString() === date.toDateString();
  return new Intl.DateTimeFormat("en-US", {
    ...(sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { month: "short", day: "numeric" }),
    timeZone: "UTC",
  }).format(date);
}

export function TalkSessionsSidebar({
  threads,
  activeThreadId,
  loading,
  onSelect,
  onNew,
}: {
  threads: TalkThreadItem[];
  activeThreadId: string | null;
  loading: boolean;
  onSelect: (threadId: string | null) => void;
  onNew: () => void;
}) {
  const t = useTranslations("employees.talk.sessions");

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-xl border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
          {t("title")}
        </span>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/3 px-2 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/6 hover:text-white"
        >
          <Plus className="size-3" />
          {t("new")}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {threads.map((thread) => {
          const active = thread.threadId === activeThreadId;
          const time = formatThreadTime(thread.lastMessageAt);
          return (
            <button
              key={thread.threadId ?? "main"}
              type="button"
              onClick={() => onSelect(thread.threadId)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                active ? "bg-white/8" : "hover:bg-white/4",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    active ? "bg-emerald-400" : "bg-white/25",
                  )}
                />
                <span className="truncate text-xs text-white/85">
                  {thread.threadId === null ? t("main") : thread.title}
                </span>
              </span>
              {time ? (
                <span className="shrink-0 text-[10px] text-white/35">{time}</span>
              ) : null}
            </button>
          );
        })}

        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="size-3.5 animate-spin text-white/40" />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
