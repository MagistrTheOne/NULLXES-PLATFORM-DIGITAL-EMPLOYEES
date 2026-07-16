"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
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
  AudioLines,
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
import { TalkWorkspaceHeader } from "./talk-workspace-header";
import type { TalkViewer } from "./talk-viewer-card";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { useTalkAnam } from "../context/talk-anam-context";
import { useTalkThreads } from "../lib/use-talk-threads";
import {
  acquireAnamInputAudioStream,
  unlockAnamVideoPlayback,
} from "../lib/acquire-anam-input-audio-stream";
import { startTalkSessionAction } from "../actions/employee-session";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { cn } from "@/lib/utils";
import { TalkLocalCameraPip } from "./talk-local-camera-pip";
import { XaiVoiceCallSheet } from "@/features/xai-voice/components/xai-voice-call-sheet";
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
  scenarioSessionId,
  activeSession,
  onSessionStarted,
  onStopSession,
  sessionBusy,
  cameraEnabled,
  onCameraToggle,
  onToggleChat,
  onShare,
  xaiVoiceAvailable,
  onOpenGrokVoice,
}: {
  employeeId: string;
  scenarioSessionId?: string;
  activeSession: ActiveTalkSession | null;
  onSessionStarted: (session: ActiveTalkSession) => void;
  onStopSession: () => Promise<void>;
  sessionBusy: boolean;
  cameraEnabled: boolean;
  onCameraToggle: () => void;
  onToggleChat?: () => void;
  onShare?: () => void;
  xaiVoiceAvailable?: boolean;
  onOpenGrokVoice?: () => void;
}) {
  const t = useTranslations("employees.talk");
  const { micMuted, micPermission, toggleMic, isLive, pipelineState, setMicPermission, stashPendingInputStream, clearPendingInputStream } =
    useTalkAnam();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const startingRef = useRef(false);

  // Green only when the persona can actually hear: live, permission granted,
  // and not muted. Red whenever input is blocked/muted/not yet granted.
  const micHearing = isLive && micPermission === "granted" && !micMuted;
  const micListening = pipelineState === "listening";

  const handleStart = async () => {
    if (startingRef.current || activeSession) {
      return;
    }

    startingRef.current = true;
    setIsStarting(true);
    setStartError(null);
    setMicPermission("pending");

    try {
      // iOS/WebKit: mic + video unlock must happen in the Start tap gesture,
      // before awaiting the server session token.
      // @see https://anam.ai/docs/resources/faq
      const inputAudioStream = await acquireAnamInputAudioStream();
      stashPendingInputStream(inputAudioStream);
      setMicPermission("granted");
      await unlockAnamVideoPlayback("nullxes-anam-persona-video");

      const result = await startTalkSessionAction(employeeId, scenarioSessionId);
      if (!result.ok) {
        clearPendingInputStream();
        setMicPermission("unknown");
        setStartError(result.message);
        return;
      }
      onSessionStarted({
        sessionId: result.sessionId,
        sessionToken: result.sessionToken,
        voiceMode: result.voiceMode,
      });
    } catch (error: unknown) {
      clearPendingInputStream();
      setMicPermission(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "denied"
          : "unknown",
      );
      setStartError(
        error instanceof Error
          ? error.message
          : t("stage.anamStreamFailed"),
      );
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  };

  const disabled = sessionBusy || isStarting;

  return (
    <>
      {/* Status / errors sit above the docked call bar */}
      {startError ? (
        <p className="talk-stage-dock-error text-center text-[11px] text-white/55">
          {startError}
        </p>
      ) : null}
      {activeSession && micPermission === "denied" ? (
        <p className="talk-stage-dock-error text-center text-[11px] text-red-300/80">
          {t("stage.micPermissionDenied")}
        </p>
      ) : null}

      {/* Docked stage controls — chrome only; Anam video crop stays frozen */}
      <div className="talk-stage-dock">
        <div className="talk-stage-dock-inner gap-2">
          {!activeSession ? (
            <>
              <Button
                type="button"
                disabled={disabled}
                onClick={() => {
                  void handleStart();
                }}
                className="h-9 rounded-full bg-white px-5 text-xs font-medium text-black hover:bg-white/90"
              >
                <Play className="size-3.5" />
                {isStarting ? t("starting") : t("startSession")}
              </Button>
              {xaiVoiceAvailable && onOpenGrokVoice ? (
                <button
                  type="button"
                  aria-label={t("sessionControls.grokVoice")}
                  title={t("sessionControls.grokVoice")}
                  disabled={disabled}
                  onClick={onOpenGrokVoice}
                  className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40"
                >
                  <AudioLines className="size-4 stroke-[1.75]" />
                </button>
              ) : null}
            </>
          ) : (
            <>
              {/* Mic — status dot: green = persona can hear you, red = it can't */}
              <button
                type="button"
                aria-label={
                  micMuted ? t("controls.unmuteMic") : t("controls.muteMic")
                }
                title={
                  micHearing
                    ? t("controls.micHearing")
                    : t("controls.micNotHearing")
                }
                disabled={!isLive || disabled}
                onClick={toggleMic}
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-xl border bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40",
                  micHearing
                    ? "border-emerald-400/50"
                    : "border-red-500/50",
                )}
              >
                {micMuted ? (
                  <MicOff className="size-4 stroke-[1.75]" />
                ) : (
                  <Mic className="size-4 stroke-[1.75]" />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-black",
                    micHearing
                      ? "bg-emerald-400"
                      : "bg-red-500",
                    micHearing && micListening && "animate-pulse",
                  )}
                />
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

              {xaiVoiceAvailable && onOpenGrokVoice ? (
                <button
                  type="button"
                  aria-label={t("sessionControls.grokVoice")}
                  title={t("sessionControls.grokVoice")}
                  disabled={disabled}
                  onClick={onOpenGrokVoice}
                  className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40"
                >
                  <AudioLines className="size-4 stroke-[1.75]" />
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
  scenarioSessionId?: string;
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
  scenarioSessionId,
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
  const threads = useTalkThreads(employeeId);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  const t = useTranslations("employees.talk");
  const showDetailsRail = detailsOpen && !focusMode;

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

  return (
    <div className="talk-workspace-shell employee-talk-workspace employee-talk-shell mx-auto flex h-full min-h-0 w-full max-h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] flex-1 flex-col overflow-hidden rounded-none border-0 bg-[#0a0a0a] sm:max-h-[calc(100dvh-3.5rem)] sm:rounded-2xl sm:border sm:border-white/10">
      <TalkWorkspaceHeader
        employeeName={employeeName}
        sessionLimitSeconds={sessionLimitSeconds}
        sessionBusy={sessionBusy}
        onEndSession={() => {
          void onLeaveSession();
        }}
        onLimitReached={onSessionLimitReached}
        onOpenDetails={() => setShowInspector(true)}
        detailsOpen={showDetailsRail}
        onToggleDetails={() => {
          if (focusMode) {
            setFocusMode(false);
            setDetailsOpen(true);
            return;
          }
          setDetailsOpen((open) => !open);
        }}
      />

      {/* Video-first Talk layout:
          - Player (Anam video crop) is frozen — see AVATAR_RENDERING_SPEC.md
          - Stage chrome only: frame, docked controls, HUD, overlays
          - Details rail is opt-in (collapsed by default). */}
      <div className="flex min-h-0 flex-1 overflow-hidden border-t border-white/8 bg-black">
        <div className="talk-stage-frame relative flex min-h-0 min-w-0 flex-1 p-1.5 sm:p-2 xl:p-2.5">
          <div className="talk-workspace-stage relative bg-black">
            <EmployeeAnamStage
              employeeId={employeeId}
              employeeName={employeeName}
              employeeSessionId={activeSession?.sessionId ?? ""}
              scenarioSessionId={scenarioSessionId}
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
              scenarioSessionId={scenarioSessionId}
              activeSession={activeSession}
              onSessionStarted={onActiveSessionChange}
              onStopSession={onStopSession}
              sessionBusy={sessionBusy}
              cameraEnabled={cameraEnabled}
              onCameraToggle={() => setCameraEnabled((value) => !value)}
              onToggleChat={() => setShowChat(true)}
              onShare={() => {
                void handleShare();
              }}
              xaiVoiceAvailable={agentDetails.xaiVoiceAvailable}
              onOpenGrokVoice={() => setVoiceSheetOpen(true)}
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
        </div>

        {showDetailsRail ? (
          <div className="hidden w-[300px] min-w-0 shrink-0 overflow-hidden border-l border-white/8 lg:flex xl:w-[340px]">
            <TalkInspectorPanel
              details={agentDetails}
              departmentLabel={departmentLabel}
              sessionId={activeSession?.sessionId}
              onEndSession={() => {
                void onLeaveSession();
              }}
              onFocusMode={() => {
                setDetailsOpen(false);
                setFocusMode(true);
              }}
              onOpenGrokVoice={() => setVoiceSheetOpen(true)}
              focusMode={focusMode}
              sessionBusy={sessionBusy}
            />
          </div>
        ) : null}
      </div>

      {focusMode ? (
        <div className="flex justify-center border-t border-white/8 px-4 py-2 lg:hidden">
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
      ) : null}

      <Sheet open={showInspector} onOpenChange={setShowInspector}>
        <SheetContent
          side="right"
          className="w-full border-white/8 bg-[#0a0a0a] p-0 sm:max-w-[400px] lg:hidden"
        >
          <SheetHeader className="border-b border-white/8 px-4 py-3">
            <SheetTitle className="text-sm font-medium">
              {t("mobileTabDetails")}
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-3.25rem)] min-h-0 overflow-y-auto">
            <TalkInspectorPanel
              details={agentDetails}
              departmentLabel={departmentLabel}
              sessionId={activeSession?.sessionId}
              onEndSession={() => {
                void onLeaveSession();
              }}
              onFocusMode={() => {
                setShowInspector(false);
                setFocusMode(true);
              }}
              onOpenGrokVoice={() => setVoiceSheetOpen(true)}
              focusMode={focusMode}
              sessionBusy={sessionBusy}
            />
          </div>
        </SheetContent>
      </Sheet>

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
              scenarioSessionId={scenarioSessionId}
              isSessionLive={Boolean(activeSession)}
              voiceMode={activeSession?.voiceMode ?? "anam"}
              viewerName={viewer.name}
              viewerImage={viewer.image}
            />
          </div>
        </SheetContent>
      </Sheet>

      {agentDetails.xaiVoiceAvailable ? (
        <XaiVoiceCallSheet
          open={voiceSheetOpen}
          onOpenChange={setVoiceSheetOpen}
          employeeId={employeeId}
          employeeName={employeeName}
          avatarPreviewUrl={avatarPreviewUrl}
          sessionId={activeSession?.sessionId}
          translationNamespace="employees.talk.xaiVoice"
        />
      ) : null}
    </div>
  );
}
