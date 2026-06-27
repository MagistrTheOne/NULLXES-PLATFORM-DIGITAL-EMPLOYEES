"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Mic,
  MicOff,
  Play,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalkAgentDetails } from "./talk-agent-details";
import { TalkInspectorPanel } from "./talk-inspector-panel";
import { TalkWorkspaceHeader } from "./talk-workspace-header";
import type { TalkViewer } from "./talk-viewer-card";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { useTalkAnam } from "../context/talk-anam-context";
import { useTalkThreads } from "../lib/use-talk-threads";
import { startTalkSessionAction } from "../actions/employee-session";
import { prefetchAnamTalkSessionAction } from "../actions/prefetch-anam-talk-session";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { TalkLocalCameraPip } from "./talk-local-camera-pip";
import "./employee-talk-theme.css";
import "@/features/conversations/components/conversations-theme.css";

const EmployeeAnamStage = dynamic(
  () =>
    import("./employee-anam-stage").then((module) => module.EmployeeAnamStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black/40">
        <Loader2 className="size-5 animate-spin text-white/50" />
      </div>
    ),
  },
);

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

export type ActiveTalkSession = {
  sessionId: string;
  sessionToken: string;
  voiceMode: TalkVoiceMode;
};

function TalkStageControls({
  employeeId,
  activeSession,
  onSessionStarted,
  onStopSession,
  sessionBusy,
  prefetchedTokenRef,
  cameraEnabled,
  onCameraToggle,
}: {
  employeeId: string;
  activeSession: ActiveTalkSession | null;
  onSessionStarted: (session: ActiveTalkSession) => void;
  onStopSession: () => Promise<void>;
  sessionBusy: boolean;
  prefetchedTokenRef: React.MutableRefObject<string | null>;
  cameraEnabled: boolean;
  onCameraToggle: () => void;
}) {
  const t = useTranslations("employees.talk");
  const { micMuted, micPermission, toggleMic, isLive } = useTalkAnam();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      const prefetchedSessionToken = prefetchedTokenRef.current ?? undefined;
      prefetchedTokenRef.current = null;
      const result = await startTalkSessionAction(employeeId, {
        prefetchedSessionToken,
      });
      if (!result.ok) {
        setStartError(result.message);
        return;
      }
      onSessionStarted({
        sessionId: result.sessionId,
        sessionToken: result.sessionToken,
        voiceMode: result.voiceMode,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const warmPrefetch = () => {
    if (prefetchedTokenRef.current || activeSession) {
      return;
    }
    void prefetchAnamTalkSessionAction(employeeId).then((result) => {
      if (result.ok) {
        prefetchedTokenRef.current = result.sessionToken;
      }
    });
  };

  const disabled = sessionBusy || isStarting;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-10">
      {startError ? (
        <p className="max-w-sm text-center text-[11px] text-white/55" role="alert">
          {startError}
        </p>
      ) : null}
      {activeSession && micPermission === "denied" ? (
        <p className="max-w-sm text-center text-[11px] text-red-300/80" role="alert">
          {t("stage.micPermissionDenied")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!activeSession ? (
          <Button
            type="button"
            disabled={disabled}
            className="h-9 rounded-full px-4 text-xs"
            onMouseEnter={warmPrefetch}
            onFocus={warmPrefetch}
            onClick={() => {
              void handleStart();
            }}
          >
            <Play className="size-3.5" />
            {isStarting ? t("starting") : t("startSession")}
          </Button>
        ) : (
          <>
            <button
              type="button"
              aria-label={
                micMuted ? t("controls.unmuteMic") : t("controls.muteMic")
              }
              disabled={!isLive || disabled}
              onClick={toggleMic}
              className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              {micMuted ? (
                <MicOff className="size-3.5 stroke-[1.5]" />
              ) : (
                <Mic className="size-3.5 stroke-[1.5]" />
              )}
            </button>
            <button
              type="button"
              aria-label={
                cameraEnabled
                  ? t("controls.turnOffCamera")
                  : t("controls.turnOnCamera")
              }
              disabled={disabled}
              onClick={onCameraToggle}
              className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              {cameraEnabled ? (
                <Video className="size-3.5 stroke-[1.5]" />
              ) : (
                <VideoOff className="size-3.5 stroke-[1.5]" />
              )}
            </button>
            <Button
              type="button"
              disabled={disabled}
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-white/12 bg-black/55 px-3 text-xs text-white backdrop-blur-sm hover:bg-white/10"
              onClick={() => {
                void onStopSession();
              }}
            >
              <Square className="size-3.5" />
              {sessionBusy ? t("stopping") : t("stopSession")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export type EmployeeTalkSessionInputProps = {
  chatSession: TalkChatCredentials | null;
  actorUserId: string;
  actorUserName: string;
  employeeId: string;
  avatarPreviewUrl: string | null;
  sessionLimitSeconds: number;
  brainModelLabel: string | null;
  agentDetails: TalkAgentDetails;
  viewer: TalkViewer;
  departmentLabel: string | null;
};

export type EmployeeTalkRoomProps = EmployeeTalkSessionInputProps & {
  employeeName: string;
  activeSession: ActiveTalkSession | null;
  onActiveSessionChange: (session: ActiveTalkSession | null) => void;
  onStopSession: () => Promise<void>;
  onLeaveSession: () => Promise<void>;
  onSessionLimitReached: () => void;
  sessionBusy: boolean;
};

export function EmployeeTalkRoom({
  employeeName,
  employeeId,
  avatarPreviewUrl,
  actorUserName,
  chatSession,
  brainModelLabel,
  agentDetails,
  viewer,
  departmentLabel,
  sessionLimitSeconds,
  activeSession,
  onActiveSessionChange,
  onStopSession,
  onLeaveSession,
  onSessionLimitReached,
  sessionBusy,
}: EmployeeTalkRoomProps) {
  const prefetchedTokenRef = useRef<string | null>(null);
  const threads = useTalkThreads(employeeId);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  useEffect(() => {
    if (activeSession) {
      return;
    }
    void prefetchAnamTalkSessionAction(employeeId).then((result) => {
      if (result.ok) {
        prefetchedTokenRef.current = result.sessionToken;
      }
    });
  }, [activeSession, employeeId]);

  return (
    <div className="talk-workspace-shell employee-talk-workspace employee-talk-shell mx-auto flex min-h-[min(88dvh,920px)] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
      <TalkWorkspaceHeader
        employeeName={employeeName}
        sessionLimitSeconds={sessionLimitSeconds}
        sessionBusy={sessionBusy}
        onEndSession={() => {
          void onLeaveSession();
        }}
        onLimitReached={onSessionLimitReached}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main content: on mobile — stage on top of chat (stack).
            On desktop (lg+) — stage + chat side-by-side so the message grid
            ("сетка") always has full available height and is clearly visible. */}
        <div className="flex min-h-0 min-w-0 flex-col border-white/8 lg:flex-row lg:border-r">
          {/* Stage / visual (video or idle preview) */}
          <div className="talk-workspace-stage relative min-h-[220px] w-full shrink-0 overflow-hidden bg-black lg:min-h-0 lg:w-[56%] lg:shrink-0 lg:border-r lg:border-white/8">
            <EmployeeAnamStage
              employeeId={employeeId}
              employeeName={employeeName}
              employeeSessionId={activeSession?.sessionId ?? ""}
              avatarPreviewUrl={avatarPreviewUrl}
              sessionToken={activeSession?.sessionToken ?? null}
              voiceMode={activeSession?.voiceMode ?? "anam"}
            />
            <TalkLocalCameraPip
              enabled={cameraEnabled}
              userName={actorUserName}
            />
            <TalkStageControls
              employeeId={employeeId}
              activeSession={activeSession}
              onSessionStarted={onActiveSessionChange}
              onStopSession={onStopSession}
              sessionBusy={sessionBusy}
              prefetchedTokenRef={prefetchedTokenRef}
              cameraEnabled={cameraEnabled}
              onCameraToggle={() => setCameraEnabled((value) => !value)}
            />
          </div>

          {/* Chat panel — now side-by-side on lg+, gets full height.
              This is the "сетка" — message list must be prominent and tall. */}
          <div className="employee-talk-chat-panel talk-workspace-chat flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <EmployeeTalkChat
              key={`${employeeId}-${threads.activeThreadId ?? "main"}`}
              embedded
              chatSession={threads.activeThreadId ? null : chatSession}
              employeeId={employeeId}
              employeeName={employeeName}
              threadId={threads.activeThreadId}
              brainModelLabel={brainModelLabel}
              employeeSessionId={activeSession?.sessionId}
              isSessionLive={Boolean(activeSession)}
              voiceMode={activeSession?.voiceMode ?? "anam"}
              viewerName={viewer.name}
              viewerImage={viewer.image}
            />
          </div>
        </div>

        {/* Right — permanent inspector rail (desktop). */}
        <div className="hidden min-h-0 lg:flex">
          <TalkInspectorPanel
            details={agentDetails}
            departmentLabel={departmentLabel}
          />
        </div>
      </div>

      {/* Mobile inspector below the canvas. */}
      <div className="max-h-[min(42dvh,360px)] min-h-0 border-t border-white/8 lg:hidden">
        <TalkInspectorPanel
          details={agentDetails}
          departmentLabel={departmentLabel}
        />
      </div>
    </div>
  );
}
