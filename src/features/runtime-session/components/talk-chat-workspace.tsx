"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2, UserRound } from "lucide-react";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
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
import { TalkViewerCard, type TalkViewer } from "./talk-viewer-card";
import type { ActiveTalkSession } from "./employee-talk-room";

export type { TalkViewer } from "./talk-viewer-card";

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

/** Compact identity header for the digital employee shown atop the left rail. */
function TalkEmployeeHeader({ details }: { details: TalkAgentDetails }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
        {details.avatarPreviewUrl && details.avatarReady ? (
          <AvatarIdlePreview
            src={details.avatarPreviewUrl}
            alt={details.name}
            sizes="40px"
          />
        ) : (
          <UserRound className="size-5 stroke-[1.25] text-white/40" />
        )}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#0a0a0a]",
            details.online ? "bg-emerald-400" : "bg-white/30",
          )}
        />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-white">
          {details.name}
        </span>
        <span className="truncate text-[11px] text-white/45">
          {details.role}
        </span>
      </div>
    </div>
  );
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
  /** The signed-in operator, sourced from the workspace DB user. */
  viewer?: TalkViewer;
  /** full = identity + sessions + chat + agent details; compact = sessions + chat. */
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
  viewer,
  variant = "full",
  className,
}: TalkChatWorkspaceProps) {
  const t = useTranslations("employees.talk.sessions");
  const tViewer = useTranslations("employees.talk.viewer");
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
  const isFull = variant === "full";
  const showDetails = isFull && Boolean(agentDetails);

  const sessionsList = (
    <TalkSessionsSidebar
      embedded
      threads={allThreads}
      activeThreadId={activeThreadId}
      loading={loading}
      onSelect={setActiveThreadId}
      onNew={handleNew}
    />
  );

  return (
    <div
      className={cn(
        "talk-chat-workspace flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]",
        className,
      )}
    >
      {/* Left rail — identity, sessions and the signed-in operator. */}
      <div className="hidden w-[260px] shrink-0 flex-col border-r border-white/8 lg:flex">
        {isFull && agentDetails ? (
          <TalkEmployeeHeader details={agentDetails} />
        ) : null}
        <div className="min-h-0 flex-1 overflow-hidden">{sessionsList}</div>
        {isFull && viewer ? (
          <div className="flex flex-col gap-2 border-t border-white/8 p-3">
            <TalkViewerCard viewer={viewer} />
            <Link
              href="/dashboard/conversations"
              className="flex items-center justify-between rounded-lg px-1 py-1 text-[11px] text-white/50 transition-colors hover:text-white/80"
            >
              {tViewer("viewAll")}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : null}
      </div>

      {/* Center — conversation surface. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/8 lg:hidden">
          <div className="max-h-32 overflow-hidden">{sessionsList}</div>
        </div>
        <div className="employee-talk-chat-panel flex min-h-0 flex-1 flex-col overflow-hidden">
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
            viewerName={viewer?.name}
            viewerImage={viewer?.image}
          />
        </div>
      </div>

      {/* Right rail — agent details. */}
      {showDetails ? (
        <div className="hidden w-[300px] shrink-0 border-l border-white/8 lg:flex">
          <TalkAgentDetailsPanel embedded details={agentDetails!} />
        </div>
      ) : null}
    </div>
  );
}
