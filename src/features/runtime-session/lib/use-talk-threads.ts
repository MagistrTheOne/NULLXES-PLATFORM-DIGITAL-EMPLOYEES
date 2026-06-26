"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { listTalkThreadsAction } from "../actions/list-talk-threads";
import type { TalkThreadItem } from "../components/talk-sessions-sidebar";

function createThreadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export type TalkThreadsController = {
  threads: TalkThreadItem[];
  activeThreadId: string | null;
  loading: boolean;
  select: (threadId: string | null) => void;
  createNew: () => void;
};

/**
 * Shared conversation thread state so the canvas chat and the Inspector's
 * sessions list stay in sync without prop drilling through every layer.
 */
export function useTalkThreads(employeeId: string): TalkThreadsController {
  const t = useTranslations("employees.talk.sessions");
  const [threads, setThreads] = useState<TalkThreadItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listTalkThreadsAction(employeeId).then((remote) => {
      if (cancelled) {
        return;
      }
      setThreads(remote);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const createNew = useCallback(() => {
    const threadId = createThreadId();
    setThreads((current) => [
      { threadId, title: "New chat", lastMessageAt: new Date().toISOString() },
      ...current,
    ]);
    setActiveThreadId(threadId);
  }, []);

  const allThreads = useMemo<TalkThreadItem[]>(
    () => [
      { threadId: null, title: t("main"), lastMessageAt: null },
      ...threads,
    ],
    [t, threads],
  );

  return {
    threads: allThreads,
    activeThreadId,
    loading,
    select: setActiveThreadId,
    createNew,
  };
}
