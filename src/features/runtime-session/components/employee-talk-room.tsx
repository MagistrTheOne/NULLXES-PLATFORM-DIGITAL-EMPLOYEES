"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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
import type { TalkAgentDetails } from "./talk-agent-details";
import { TalkAgentDetailsPanel } from "./talk-agent-details";
import { TalkChatWorkspace } from "./talk-chat-workspace";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { useTalkAnam } from "../context/talk-anam-context";
import { startTalkSessionAction } from "../actions/employee-session";
import { prefetchAnamTalkSessionAction } from "../actions/prefetch-anam-talk-session";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { TalkLocalCameraPip } from "./talk-local-camera-pip";
import { useTalkDesktopLayout } from "../lib/use-talk-desktop-layout";
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

  const handleStop = async () => {
    if (!activeSession || sessionBusy) {
      return;
    }
    await onStopSession();
  };

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
            void onLeaveSession();
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

export type EmployeeTalkSessionInputProps = {
  chatSession: TalkChatCredentials | null;
  actorUserId: string;
  actorUserName: string;
  employeeId: string;
  avatarPreviewUrl: string | null;
  sessionLimitSeconds: number;
  brainModelLabel: string | null;
  agentDetails: TalkAgentDetails;
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
  const isDesktop = useTalkDesktopLayout();
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

  if (isDesktop === null) {
    return (
      <div className="employee-talk-workspace employee-talk-shell mx-auto flex min-h-[min(70dvh,640px)] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-white/50" />
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="employee-talk-workspace employee-talk-shell mx-auto w-full">
        <div className="flex min-h-0 flex-col gap-4">
          <TalkStagePanel {...props} prefetchedTokenRef={prefetchedTokenRef} />
          <TalkChatWorkspace
            employeeId={props.employeeId}
            employeeName={props.employeeName}
            chatSession={props.chatSession}
            brainModelLabel={props.brainModelLabel}
            activeSession={props.activeSession}
            isSessionLive={Boolean(props.activeSession)}
            agentDetails={props.agentDetails}
            variant="full"
            className="min-h-[min(42dvh,480px)]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="employee-talk-workspace employee-talk-shell mx-auto w-full">
      <Tabs
        defaultValue="stage"
        className="employee-talk-mobile-tabs flex min-h-[min(70dvh,640px)] flex-col"
      >
        <TabsList className="mb-3 grid h-10 w-full shrink-0 grid-cols-3 rounded-lg border border-white/10 bg-white/4 p-1">
          <TabsTrigger value="stage">{t("mobileTabStage")}</TabsTrigger>
          <TabsTrigger value="chat">{t("mobileTabChat")}</TabsTrigger>
          <TabsTrigger value="details">{t("mobileTabDetails")}</TabsTrigger>
        </TabsList>
        <TabsContent value="stage" className="employee-talk-mobile-tab-panel mt-0 flex min-h-0 flex-1 flex-col">
          <TalkStagePanel {...props} prefetchedTokenRef={prefetchedTokenRef} />
        </TabsContent>
        <TabsContent value="chat" className="employee-talk-mobile-tab-panel mt-0 flex min-h-0 flex-1 flex-col">
          <TalkChatWorkspace
            employeeId={props.employeeId}
            employeeName={props.employeeName}
            chatSession={props.chatSession}
            brainModelLabel={props.brainModelLabel}
            activeSession={props.activeSession}
            isSessionLive={Boolean(props.activeSession)}
            variant="compact"
            className="min-h-0 flex-1"
          />
        </TabsContent>
        <TabsContent value="details" className="employee-talk-mobile-tab-panel mt-0 flex min-h-0 flex-1 flex-col">
          <TalkAgentDetailsPanel details={props.agentDetails} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function EmployeeTalkRoom(props: EmployeeTalkRoomProps) {
  return <TalkRoomLayout {...props} />;
}
