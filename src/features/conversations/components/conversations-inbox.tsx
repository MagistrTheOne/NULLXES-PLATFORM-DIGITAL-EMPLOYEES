"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { listTalkThreadsAction } from "@/features/runtime-session/actions/list-talk-threads";
import type { TalkThreadItem } from "@/features/runtime-session/components/talk-sessions-sidebar";
import { ConversationAvatar } from "./conversation-avatar";
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

function ConversationListItem({
  active,
  onClick,
  avatar,
  name,
  preview,
  meta,
  time,
}: {
  active: boolean;
  onClick: () => void;
  avatar: ReactNode;
  name: string;
  preview?: string;
  meta?: string;
  time?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-xl py-3 px-3 text-left transition-all",
        "bg-white/1.5 hover:bg-white/4",
        active
          ? "bg-white/8 shadow-sm ring-1 ring-inset ring-white/10"
          : "",
      )}
    >
      {avatar}
      <span className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-white">{name}</span>
          {time ? (
            <span className="shrink-0 text-[10px] font-normal text-white/35 tabular-nums">
              {time}
            </span>
          ) : null}
        </div>

        {meta ? (
          <div className="text-[11px] font-normal leading-tight text-white/35">
            <span className="line-clamp-1">{meta}</span>
          </div>
        ) : null}

        {preview ? (
          <div className="text-xs font-normal leading-snug text-white/60">
            <span className="line-clamp-2">{preview}</span>
          </div>
        ) : null}
      </span>
    </button>
  );
}

export function ConversationsInbox({
  employees,
  selectedEmployee,
  activeThreadId,
  onSelectEmployee,
  onSelectThread,
  searchQuery,
  className,
  threadsVersion = 0,
}: {
  employees: ConversationEmployee[];
  selectedEmployee: ConversationEmployee | null;
  activeThreadId: string | null;
  onSelectEmployee: (employeeId: string) => void;
  onSelectThread: (threadId: string | null) => void;
  searchQuery: string;
  className?: string;
  threadsVersion?: number;
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
  }, [selectedEmployee, threadsVersion]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const baseList = useMemo(() => employees, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!normalizedSearch) {
      return baseList;
    }
    return baseList.filter(
      (employee) =>
        employee.name.toLowerCase().includes(normalizedSearch) ||
        (employee.role || "").toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, baseList]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-r border-white/8 bg-[#0a0a0a]",
        className,
      )}
    >
      <div className="shrink-0 border-b border-white/8 px-4 py-4">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as InboxTab)}
          className="gap-0"
        >
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-6 rounded-none bg-transparent p-0"
          >
            {(["all", "unread", "mentions"] as const).map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35 shadow-none data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                {t(`tabs.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-2">
          {filteredEmployees.map((employee) => {
            const isSelected = employee.id === selectedEmployee?.id;
            const isMainActive = isSelected && activeThreadId === null;
            return (
              <ConversationListItem
                key={employee.id}
                active={isMainActive}
                onClick={() => {
                  onSelectEmployee(employee.id);
                  onSelectThread(null);
                }}
                avatar={
                  <ConversationAvatar
                    name={employee.name}
                    previewUrl={employee.avatarPreviewUrl}
                    ready={employee.avatarProvisioningStatus === "ready"}
                    online
                    size="default"
                  />
                }
                name={employee.name}
                meta={employee.role}
                preview={isSelected ? t("previewMain") : undefined}
              />
            );
          })}

          {selectedEmployee && tab === "all" ? (
            <div className="mt-2 border-t border-white/8 pt-3">
              {/* Optimistic new conversation (if activeThreadId not yet in remote list) */}
              {activeThreadId &&
              !threads.some((t) => t.threadId === activeThreadId) ? (
                <ConversationListItem
                  active
                  onClick={() => onSelectThread(activeThreadId)}
                  avatar={
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/4 text-[10px] font-medium text-white/70">
                      NC
                    </span>
                  }
                  name="New conversation"
                  meta={`${selectedEmployee.name} · ${selectedEmployee.role}`}
                  preview={t("previewThread")}
                />
              ) : null}

              {threads.map((thread) => {
                const active = thread.threadId === activeThreadId;
                return (
                  <ConversationListItem
                    key={thread.threadId ?? "thread"}
                    active={active}
                    onClick={() => onSelectThread(thread.threadId)}
                    avatar={
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/4 text-[10px] font-medium text-white/70">
                        {threadInitials(thread.title)}
                      </span>
                    }
                    name={thread.title}
                    meta={`${selectedEmployee.name} · ${selectedEmployee.role}`}
                    preview={t("previewThread")}
                    time={formatInboxTime(thread.lastMessageAt)}
                  />
                );
              })}
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-16 rounded-lg bg-white/4" />
              <Skeleton className="h-16 rounded-lg bg-white/4" />
            </div>
          ) : null}

          {filteredEmployees.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs font-normal text-white/40">
              {t("emptyRoster")}
            </p>
          ) : null}
        </div>
      </ScrollArea>

      <Separator className="bg-white/8" />
      <div className="shrink-0 p-2">
        <Button
          variant="ghost"
          className="h-10 w-full justify-center gap-2 text-xs font-normal text-white/45 hover:bg-white/4 hover:text-white/70"
          asChild
        >
          <Link href="/dashboard/conversations">
            {t("viewAll")}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
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
