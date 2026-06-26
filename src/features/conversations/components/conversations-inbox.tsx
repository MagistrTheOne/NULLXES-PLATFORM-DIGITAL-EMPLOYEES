"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { cn } from "@/lib/utils";
import { listTalkThreadsAction } from "@/features/runtime-session/actions/list-talk-threads";
import type { TalkThreadItem } from "@/features/runtime-session/components/talk-sessions-sidebar";
import type { ConversationEmployee } from "./conversations-screen";

type InboxTab = "all" | "unread" | "mentions";

function formatInboxTime(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }
  if (isYesterday) {
    return "Yesterday";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function threadInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

function createThreadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export function ConversationsInbox({
  employees,
  selectedEmployee,
  activeThreadId,
  onSelectEmployee,
  onSelectThread,
  searchQuery,
  className,
}: {
  employees: ConversationEmployee[];
  selectedEmployee: ConversationEmployee | null;
  activeThreadId: string | null;
  onSelectEmployee: (employeeId: string) => void;
  onSelectThread: (threadId: string | null) => void;
  searchQuery: string;
  className?: string;
}) {
  const t = useTranslations("conversations");
  const [tab, setTab] = useState<InboxTab>("all");
  const [threads, setThreads] = useState<TalkThreadItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedEmployee) {
      setThreads([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void listTalkThreadsAction(selectedEmployee.id).then((remote) => {
      if (!cancelled) {
        setThreads(remote);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedEmployee]);

  const talkReady = useMemo(
    () => employees.filter((employee) => employee.canTalk),
    [employees],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredEmployees = useMemo(() => {
    if (!normalizedSearch) {
      return talkReady;
    }
    return talkReady.filter(
      (employee) =>
        employee.name.toLowerCase().includes(normalizedSearch) ||
        employee.role.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, talkReady]);

  return (
    <aside
      className={cn(
        "conversations-inbox flex h-full min-h-0 flex-col border-r border-white/8 bg-[#0a0a0a]",
        className,
      )}
    >
      <div className="conversations-pane-header flex shrink-0 items-end gap-5 border-b border-white/8 px-4">
        {(["all", "unread", "mentions"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "border-b-2 pb-3 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
              tab === value
                ? "border-white text-white"
                : "border-transparent text-white/35 hover:text-white/55",
            )}
          >
            {t(`tabs.${value}`)}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
        {filteredEmployees.map((employee) => {
          const isSelected = employee.id === selectedEmployee?.id;
          const isMainActive = isSelected && activeThreadId === null;
          return (
            <button
              key={employee.id}
              type="button"
              onClick={() => {
                onSelectEmployee(employee.id);
                onSelectThread(null);
              }}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                isMainActive ? "bg-white/8" : "hover:bg-white/4",
              )}
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black">
                {employee.avatarPreviewUrl &&
                employee.avatarProvisioningStatus === "ready" ? (
                  <AvatarIdlePreview
                    src={employee.avatarPreviewUrl}
                    alt={employee.name}
                    sizes="40px"
                  />
                ) : (
                  <UserRound className="size-4 text-white/40" />
                )}
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#0a0a0a] bg-emerald-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-white">
                    {employee.name}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-white/40">
                  {employee.role}
                </span>
                {isSelected ? (
                  <span className="mt-1 block truncate text-[11px] text-white/55">
                    {t("previewMain")}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}

        {selectedEmployee && tab === "all"
          ? threads.map((thread) => {
              const active = thread.threadId === activeThreadId;
              return (
                <button
                  key={thread.threadId ?? "thread"}
                  type="button"
                  onClick={() => onSelectThread(thread.threadId)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                    active ? "bg-white/8" : "hover:bg-white/4",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-[10px] font-medium text-white/70">
                    {threadInitials(thread.title)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-white">
                        {thread.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-white/35 tabular-nums">
                        {formatInboxTime(thread.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/40">
                      {selectedEmployee.name} · {selectedEmployee.role}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-white/55">
                      {t("previewThread")}
                    </span>
                  </span>
                </button>
              );
            })
          : null}

        {filteredEmployees.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-white/40">
            {t("emptyRoster")}
          </p>
        ) : null}

        {loading ? (
          <p className="px-2 py-2 text-center text-[10px] text-white/30">
            {t("loadingThreads")}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-white/8 p-2">
        <Link
          href="/dashboard/conversations"
          className="flex w-full items-center justify-center rounded-lg py-2 text-[11px] text-white/45 transition-colors hover:bg-white/4 hover:text-white/70"
        >
          {t("viewAll")}
        </Link>
      </div>
    </aside>
  );
}

export function useConversationsThreads(selectedEmployeeId: string | null) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  useEffect(() => {
    setActiveThreadId(null);
  }, [selectedEmployeeId]);

  const createThread = useCallback(() => {
    const threadId = createThreadId();
    setActiveThreadId(threadId);
    return threadId;
  }, []);

  return {
    activeThreadId,
    selectThread: setActiveThreadId,
    createThread,
  };
}
