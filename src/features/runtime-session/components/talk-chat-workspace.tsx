"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listTalkThreadsAction } from "../actions/list-talk-threads";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import {
  TalkAgentDetailsPanel,
  type TalkAgentDetails,
} from "./talk-agent-details";
import {
  TalkSessionsSidebar,
  type TalkThreadItem,
} from "./talk-sessions-sidebar";
import type { ActiveTalkSession } from "./employee-talk-room";

const EmployeeTalkChat = dynamic(
  () =>
    import("./employee-talk-chat").then((module) => module.EmployeeTalkChat),
  {
    ssr: false,
    loading: () => (
      <div className="employee-talk-chat-fallback flex h-full items-center justify-center">
        <Loader2 className="size-4 animate-spin text-white/50" />
      </div>
    ),
  },
);

function createThreadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export type TalkChatWorkspaceProps = {
  employeeId: string;
  employeeName: string;
  chatSession: TalkChatCredentials | null;
  brainModelLabel?: string | null;
  activeSession?: ActiveTalkSession | null;
  isSessionLive?: boolean;
  voiceMode?: TalkVoiceMode;
  agentDetails?: TalkAgentDetails;
  /** full = sessions + chat + agent details; compact = sessions + chat only */
  variant?: "full" | "compact";
  className?: string;
};

export function TalkChatWorkspace({
  employeeId,
  employeeName,
  chatSession,
  brainModelLabel,
  activeSession = null,
  isSessionLive = false,
  voiceMode = "anam",
  agentDetails,
  variant = "full",
  className,
}: TalkChatWorkspaceProps) {
  const t = useTranslations("employees.talk.sessions");
  const [threads, setThreads] = useState<TalkThreadItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mainThread: TalkThreadItem = {
    threadId: null,
    title: t("main"),
    lastMessageAt: null,
  };

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

  const handleNew = useCallback(() => {
    const threadId = createThreadId();
    setThreads((current) => [
      { threadId, title: "New chat", lastMessageAt: new Date().toISOString() },
      ...current,
    ]);
    setActiveThreadId(threadId);
  }, []);

  const allThreads = [mainThread, ...threads];
  const showDetails = variant === "full" && agentDetails;

  const chatPanel = (
    <div className="employee-talk-chat-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
      <EmployeeTalkChat
        key={`${employeeId}-${activeThreadId ?? "main"}`}
        chatSession={activeThreadId ? null : chatSession}
        employeeId={employeeId}
        employeeName={employeeName}
        threadId={activeThreadId}
        brainModelLabel={brainModelLabel}
        employeeSessionId={activeSession?.sessionId}
        isSessionLive={isSessionLive}
        voiceMode={activeSession?.voiceMode ?? voiceMode}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "talk-chat-workspace grid min-h-0 flex-1 gap-3",
        showDetails
          ? "lg:grid-cols-[168px_minmax(0,1fr)_280px]"
          : "lg:grid-cols-[168px_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="hidden min-h-0 lg:block">
        <TalkSessionsSidebar
          threads={allThreads}
          activeThreadId={activeThreadId}
          loading={loading}
          onSelect={setActiveThreadId}
          onNew={handleNew}
        />
      </div>

      <div className="flex min-h-0 flex-col gap-2 lg:contents">
        <div className="max-h-36 shrink-0 lg:hidden">
          <TalkSessionsSidebar
            threads={allThreads}
            activeThreadId={activeThreadId}
            loading={loading}
            onSelect={setActiveThreadId}
            onNew={handleNew}
          />
        </div>
        {chatPanel}
      </div>

      {showDetails ? (
        <div className="hidden min-h-0 lg:flex">
          <TalkAgentDetailsPanel details={agentDetails} />
        </div>
      ) : null}
    </div>
  );
}
