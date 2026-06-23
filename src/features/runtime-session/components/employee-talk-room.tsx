"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { useTalkAnam } from "../context/talk-anam-context";
import { startTalkSessionAction } from "../actions/employee-session";
import { prefetchAnamTalkSessionAction } from "../actions/prefetch-anam-talk-session";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { TalkLocalCameraPip } from "./talk-local-camera-pip";
import "./employee-talk-theme.css";

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

function TalkIconControl({
  ariaLabel,
  disabled,
  onClick,
  children,
}: {
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/4 text-white transition-colors",
        "hover:bg-white/8 disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function TalkControlsBar({
  cameraEnabled,
  onCameraToggle,
  employeeId,
  activeSession,
  onSessionStarted,
  onStopSession,
  onLeaveSession,
  sessionBusy,
  prefetchedTokenRef,
}: {
  cameraEnabled: boolean;
  onCameraToggle: () => void;
  employeeId: string;
  activeSession: ActiveTalkSession | null;
  onSessionStarted: (session: ActiveTalkSession) => void;
  onStopSession: () => Promise<void>;
  onLeaveSession: () => Promise<void>;
  sessionBusy: boolean;
  prefetchedTokenRef: React.MutableRefObject<string | null>;
}) {
  const t = useTranslations("employees.talk");
  const { micMuted, micPermission, toggleMic, isLive } = useTalkAnam();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
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
  }, [employeeId, onSessionStarted, prefetchedTokenRef]);

  const warmPrefetch = useCallback(() => {
    if (prefetchedTokenRef.current || activeSession) {
      return;
    }

    void prefetchAnamTalkSessionAction(employeeId).then((result) => {
      if (result.ok) {
        prefetchedTokenRef.current = result.sessionToken;
      }
    });
  }, [activeSession, employeeId, prefetchedTokenRef]);

  const handleStop = useCallback(async () => {
    if (!activeSession || sessionBusy) {
      return;
    }

    await onStopSession();
  }, [activeSession, onStopSession, sessionBusy]);

  const handleLeave = useCallback(async () => {
    if (sessionBusy) {
      return;
    }

    await onLeaveSession();
  }, [onLeaveSession, sessionBusy]);

  const controlsDisabled = sessionBusy || isStarting;

  return (
    <div className="employee-talk-controls flex flex-col items-center gap-2 py-4">
      {startError ? (
        <p className="max-w-md text-center text-xs text-white/55" role="alert">
          {startError}
        </p>
      ) : null}
      {activeSession && micPermission === "denied" ? (
        <p className="max-w-md text-center text-xs text-red-300/80" role="alert">
          {t("stage.micPermissionDenied")}
        </p>
      ) : null}
      {activeSession && micPermission === "pending" ? (
        <p className="max-w-md text-center text-xs text-white/55">
          {t("stage.micPermissionPending")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!activeSession ? (
          <Button
            type="button"
            disabled={controlsDisabled}
            className="h-11 rounded-full px-5 text-sm"
            onMouseEnter={warmPrefetch}
            onFocus={warmPrefetch}
            onClick={() => {
              void handleStart();
            }}
          >
            <Play className="size-4" />
            {isStarting ? t("starting") : t("startSession")}
          </Button>
        ) : (
          <>
            <TalkIconControl
              ariaLabel={
                micMuted ? t("controls.unmuteMic") : t("controls.muteMic")
              }
              disabled={!isLive || controlsDisabled}
              onClick={toggleMic}
            >
              <span className="relative flex items-center justify-center">
                {micMuted ? (
                  <MicOff className="size-4 stroke-[1.5]" />
                ) : (
                  <Mic className="size-4 stroke-[1.5]" />
                )}
                {!micMuted && isLive ? (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 size-2 rounded-full",
                      micPermission === "granted"
                        ? "bg-emerald-300"
                        : micPermission === "pending"
                          ? "bg-amber-300"
                          : "bg-red-400",
                    )}
                    aria-hidden
                  />
                ) : null}
              </span>
            </TalkIconControl>
            <TalkIconControl
              ariaLabel={
                cameraEnabled
                  ? t("controls.turnOffCamera")
                  : t("controls.turnOnCamera")
              }
              disabled={controlsDisabled}
              onClick={onCameraToggle}
            >
              {cameraEnabled ? (
                <Video className="size-4 stroke-[1.5]" />
              ) : (
                <VideoOff className="size-4 stroke-[1.5]" />
              )}
            </TalkIconControl>
            <Button
              type="button"
              disabled={controlsDisabled}
              variant="outline"
              className="h-11 rounded-full border-white/12 bg-white/4 px-5 text-sm text-white hover:bg-white/8"
              onClick={() => {
                void handleStop();
              }}
            >
              <Square className="size-4" />
              {sessionBusy ? t("stopping") : t("stopSession")}
            </Button>
          </>
        )}
        <Button
          type="button"
          disabled={sessionBusy}
          variant="destructive"
          className="h-11 rounded-full px-5 text-sm"
          onClick={() => {
            void handleLeave();
          }}
        >
          <PhoneOff className="size-4" />
          {t("leave")}
        </Button>
      </div>
    </div>
  );
}

function TalkStagePanel({
  chatSession,
  actorUserName,
  employeeName,
  employeeId,
  avatarPreviewUrl,
  activeSession,
  onActiveSessionChange,
  onStopSession,
  onLeaveSession,
  sessionBusy,
  prefetchedTokenRef,
}: EmployeeTalkRoomProps & {
  prefetchedTokenRef: React.MutableRefObject<string | null>;
}) {
  const [cameraEnabled, setCameraEnabled] = useState(false);

  return (
    <div className="employee-talk-primary flex min-h-0 min-w-0 flex-col">
      <div className="employee-talk-stage-wrap relative min-h-0 w-full">
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
      </div>
      <TalkControlsBar
        cameraEnabled={cameraEnabled}
        employeeId={employeeId}
        activeSession={activeSession}
        onSessionStarted={onActiveSessionChange}
        onStopSession={onStopSession}
        onLeaveSession={onLeaveSession}
        sessionBusy={sessionBusy}
        prefetchedTokenRef={prefetchedTokenRef}
        onCameraToggle={() => setCameraEnabled((current) => !current)}
      />
    </div>
  );
}

function TalkChatPanel({
  chatSession,
  employeeId,
  activeSession,
}: Pick<
  EmployeeTalkRoomProps,
  "chatSession" | "employeeId" | "activeSession"
>) {
  return (
    <div className="employee-talk-chat-panel flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] lg:self-stretch">
      <EmployeeTalkChat
        chatSession={chatSession}
        employeeId={employeeId}
        employeeSessionId={activeSession?.sessionId}
        isSessionLive={Boolean(activeSession)}
        voiceMode={activeSession?.voiceMode ?? "anam"}
      />
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
};

export type EmployeeTalkRoomProps = EmployeeTalkSessionInputProps & {
  employeeName: string;
  activeSession: ActiveTalkSession | null;
  onActiveSessionChange: (session: ActiveTalkSession | null) => void;
  onStopSession: () => Promise<void>;
  onLeaveSession: () => Promise<void>;
  sessionBusy: boolean;
};

function TalkRoomLayout(props: EmployeeTalkRoomProps) {
  const t = useTranslations("employees.talk");
  const prefetchedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (props.activeSession) {
      return;
    }

    void prefetchAnamTalkSessionAction(props.employeeId).then((result) => {
      if (result.ok) {
        prefetchedTokenRef.current = result.sessionToken;
      }
    });
  }, [props.activeSession, props.employeeId]);

  return (
    <div className="employee-talk-workspace employee-talk-shell mx-auto w-full">
      <div className="employee-talk-grid employee-talk-desktop-layout hidden min-h-0 gap-4 min-[900px]:grid min-[900px]:grid-cols-[1fr_300px] min-[900px]:items-stretch lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <TalkStagePanel {...props} prefetchedTokenRef={prefetchedTokenRef} />
        <TalkChatPanel
          chatSession={props.chatSession}
          employeeId={props.employeeId}
          activeSession={props.activeSession}
        />
      </div>

      <Tabs
        defaultValue="stage"
        className="employee-talk-mobile-tabs flex min-h-[min(70dvh,640px)] flex-col min-[900px]:!hidden"
      >
        <TabsList className="mb-3 grid h-10 w-full shrink-0 grid-cols-2 rounded-lg border border-white/10 bg-white/4 p-1">
          <TabsTrigger
            value="stage"
            className="rounded-md text-sm text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            {t("mobileTabStage")}
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-md text-sm text-white/60 data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            {t("mobileTabChat")}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="stage"
          className="employee-talk-mobile-tab-panel mt-0 flex min-h-0 flex-1 flex-col"
        >
          <TalkStagePanel {...props} prefetchedTokenRef={prefetchedTokenRef} />
        </TabsContent>
        <TabsContent
          value="chat"
          className="employee-talk-mobile-tab-panel mt-0 flex min-h-0 flex-1 flex-col"
        >
          <TalkChatPanel
            chatSession={props.chatSession}
            employeeId={props.employeeId}
            activeSession={props.activeSession}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function EmployeeTalkRoom(props: EmployeeTalkRoomProps) {
  return <TalkRoomLayout {...props} />;
}
