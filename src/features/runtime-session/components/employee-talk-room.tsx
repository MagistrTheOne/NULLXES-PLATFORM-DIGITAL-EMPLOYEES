"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Mic,
  MicOff,
  Play,
  Share2,
  Square,
  Video,
  VideoOff,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TalkAgentDetails } from "./talk-agent-details";
import { TalkInspectorPanel } from "./talk-inspector-panel";
import { TalkWorkforceStrip } from "./talk-workforce-strip";
import type { TalkWorkforceSnapshot } from "../queries/get-talk-workforce-snapshot";
import { TalkWorkspaceHeader } from "./talk-workspace-header";
import type { TalkViewer } from "./talk-viewer-card";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { useTalkAnam } from "../context/talk-anam-context";
import { useTalkThreads } from "../lib/use-talk-threads";
import { startTalkSessionAction } from "../actions/employee-session";
import { prefetchAnamTalkSessionAction } from "../actions/prefetch-anam-talk-session";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { cn } from "@/lib/utils";
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
  onToggleChat,
  onShare,
}: {
  employeeId: string;
  activeSession: ActiveTalkSession | null;
  onSessionStarted: (session: ActiveTalkSession) => void;
  onStopSession: () => Promise<void>;
  sessionBusy: boolean;
  prefetchedTokenRef: React.MutableRefObject<string | null>;
  cameraEnabled: boolean;
  onCameraToggle: () => void;
  onToggleChat?: () => void;
  onShare?: () => void;
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
    <>
      {/* Subtle status / error messages above the bar */}
      {startError ? (
        <p className="absolute inset-x-0 bottom-20 z-30 flex justify-center text-center text-[11px] text-white/55">
          {startError}
        </p>
      ) : null}
      {activeSession && micPermission === "denied" ? (
        <p className="absolute inset-x-0 bottom-20 z-30 flex justify-center text-center text-[11px] text-red-300/80">
          {t("stage.micPermissionDenied")}
        </p>
      ) : null}

      {/* Floating call controls — video-call style, centered over the stage (concept match) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 z-30 flex justify-center lg:bottom-14">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/12 bg-black/70 px-2 py-1.5 backdrop-blur-md">
          {!activeSession ? (
            <Button
              type="button"
              disabled={disabled}
              onMouseEnter={warmPrefetch}
              onFocus={warmPrefetch}
              onClick={() => {
                void handleStart();
              }}
              className="h-9 rounded-full bg-white px-5 text-xs font-medium text-black hover:bg-white/90"
            >
              <Play className="size-3.5" />
              {isStarting ? t("starting") : t("startSession")}
            </Button>
          ) : (
            <>
              {/* Mic */}
              <button
                type="button"
                aria-label={
                  micMuted ? t("controls.unmuteMic") : t("controls.muteMic")
                }
                disabled={!isLive || disabled}
                onClick={toggleMic}
                className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40"
              >
                {micMuted ? (
                  <MicOff className="size-4 stroke-[1.75]" />
                ) : (
                  <Mic className="size-4 stroke-[1.75]" />
                )}
              </button>

              {/* Camera (local pip) */}
              <button
                type="button"
                aria-label={
                  cameraEnabled
                    ? t("controls.turnOffCamera")
                    : t("controls.turnOnCamera")
                }
                disabled={disabled}
                onClick={onCameraToggle}
                className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40"
              >
                {cameraEnabled ? (
                  <Video className="size-4 stroke-[1.75]" />
                ) : (
                  <VideoOff className="size-4 stroke-[1.75]" />
                )}
              </button>

              {/* Share */}
              {onShare ? (
                <button
                  type="button"
                  aria-label={t("controls.shareSession")}
                  disabled={disabled}
                  onClick={onShare}
                  className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40"
                >
                  <Share2 className="size-4 stroke-[1.75]" />
                </button>
              ) : null}

              {/* Chat / transcript (opens the messages sheet to keep video area clean) */}
              {onToggleChat ? (
                <button
                  type="button"
                  aria-label="Open chat"
                  onClick={onToggleChat}
                  className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                >
                  <MessageSquare className="size-4 stroke-[1.75]" />
                </button>
              ) : null}

              {/* End session — prominent */}
              <Button
                type="button"
                disabled={disabled}
                variant="outline"
                size="sm"
                onClick={() => {
                  void onStopSession();
                }}
                className="h-9 rounded-xl border-white/20 bg-white/5 px-4 text-xs text-white hover:bg-white/10"
              >
                <Square className="size-3.5" />
                {sessionBusy ? t("stopping") : t("stopSession")}
              </Button>

              {/* Subtle quality badge like the reference */}
              <div className="ml-1 hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-white/50 sm:flex">
                HD
              </div>
            </>
          )}
        </div>
      </div>
    </>
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
  workforceSnapshot: TalkWorkforceSnapshot;
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
  workforceSnapshot,
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
  const [showChat, setShowChat] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const t = useTranslations("employees.talk");

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
  };

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
    <div className="talk-workspace-shell employee-talk-workspace employee-talk-shell mx-auto flex flex-1 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] min-h-[min(78dvh,820px)]">
      <TalkWorkspaceHeader
        employeeName={employeeName}
        sessionLimitSeconds={sessionLimitSeconds}
        sessionBusy={sessionBusy}
        onEndSession={() => {
          void onLeaveSession();
        }}
        onLimitReached={onSessionLimitReached}
      />

      {/* Video-call centric layout inspired by the concept:
          - Large immersive stage (video / preview) is the hero.
          - Floating controls overlaid on the stage (mic, cam, chat toggle, end).
          - Right panel: agent information exactly as we already provide (Details / Activity / Notes tabs, stats, current activity).
          - Text chat is available on demand via Sheet (keeps the call UI clean and focused like the reference). */}
      <div className="flex min-h-0 flex-1 overflow-hidden border-t border-white/8">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-black">
          <div className="talk-workspace-stage relative min-h-0 flex-1 overflow-hidden bg-black">
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
              onToggleChat={() => setShowChat(true)}
              onShare={() => {
                void handleShare();
              }}
            />
            {focusMode ? (
              <div className="absolute top-4 right-4 z-30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFocusMode(false)}
                  className="h-8 border-white/15 bg-black/70 text-xs text-white/80 hover:bg-white/10"
                >
                  {t("sessionControls.exitFocus")}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="talk-workforce-panel shrink-0 border-t border-white/8 bg-[#0a0a0a] p-3">
            <TalkWorkforceStrip snapshot={workforceSnapshot} />
          </div>
        </div>

        {!focusMode ? (
          <div className="hidden w-[340px] min-w-0 shrink-0 overflow-hidden border-l border-white/8 md:flex">
            <TalkInspectorPanel
              details={agentDetails}
              departmentLabel={departmentLabel}
              onEndSession={() => {
                void onLeaveSession();
              }}
              onFocusMode={() => setFocusMode(true)}
              focusMode={focusMode}
              sessionBusy={sessionBusy}
            />
          </div>
        ) : null}
      </div>

      {!focusMode ? (
        <div className="max-h-[min(42dvh,360px)] min-h-0 border-t border-white/8 md:hidden">
          <TalkInspectorPanel
            details={agentDetails}
            departmentLabel={departmentLabel}
            onEndSession={() => {
              void onLeaveSession();
            }}
            onFocusMode={() => setFocusMode(true)}
            focusMode={focusMode}
            sessionBusy={sessionBusy}
          />
        </div>
      ) : (
        <div className="flex justify-center border-t border-white/8 px-4 py-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFocusMode(false)}
            className="text-xs text-white/60"
          >
            {t("sessionControls.exitFocus")}
          </Button>
        </div>
      )}

      {/* On-demand chat / transcript sheet — opened from the floating control bar.
          This lets the main view stay true to the video-call concept while keeping full chat functionality. */}
      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent
          side="right"
          className="w-full border-white/8 bg-[#0a0a0a] p-0 sm:max-w-[380px]"
        >
          <SheetHeader className="border-b border-white/8 px-4 py-3">
            <SheetTitle className="text-sm font-medium">
              Chat with {employeeName}
            </SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100%-3.25rem)] min-h-0 flex-col">
            <EmployeeTalkChat
              key={`sheet-${employeeId}-${threads.activeThreadId ?? "main"}`}
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
