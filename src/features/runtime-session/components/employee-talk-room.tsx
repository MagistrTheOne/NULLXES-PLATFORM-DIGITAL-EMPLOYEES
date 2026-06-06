"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mic, MicOff, PhoneOff, Play, Square, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { useTalkAnam } from "../context/talk-anam-context";
import {
  completeTalkSessionAction,
  startTalkSessionAction,
} from "../actions/employee-session";
import type { TalkVoiceMode } from "../services/resolve-talk-voice-mode";
import { EmployeeAnamStage } from "./employee-anam-stage";
import { EmployeeTalkChat } from "./employee-talk-chat";
import { TalkLocalCameraPip } from "./talk-local-camera-pip";
import "stream-chat-react/css/index.css";
import "./employee-talk-theme.css";

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
  onSessionStopped,
}: {
  cameraEnabled: boolean;
  onCameraToggle: () => void;
  employeeId: string;
  activeSession: ActiveTalkSession | null;
  onSessionStarted: (session: ActiveTalkSession) => void;
  onSessionStopped: () => void;
}) {
  const t = useTranslations("employees.talk");
  const router = useRouter();
  const { micMuted, toggleMic, stopSession, isLive } = useTalkAnam();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      const result = await startTalkSessionAction(employeeId);
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
  }, [employeeId, onSessionStarted]);

  const handleStop = useCallback(async () => {
    if (!activeSession || isStopping) {
      return;
    }
    setIsStopping(true);
    try {
      await stopSession();
      await completeTalkSessionAction(activeSession.sessionId);
      onSessionStopped();
    } finally {
      setIsStopping(false);
    }
  }, [activeSession, isStopping, onSessionStopped, stopSession]);

  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      if (activeSession) {
        await stopSession();
        await completeTalkSessionAction(activeSession.sessionId);
      }
    } finally {
      router.push("/dashboard/employees");
    }
  }, [activeSession, router, stopSession]);

  const sessionBusy = isStarting || isStopping || isLeaving;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {startError ? (
        <p className="max-w-md text-center text-xs text-white/55" role="alert">
          {startError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!activeSession ? (
          <Button
            type="button"
            disabled={sessionBusy}
            className="h-11 rounded-full px-5 text-sm"
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
              disabled={!isLive || sessionBusy}
              onClick={toggleMic}
            >
              {micMuted ? (
                <MicOff className="size-4 stroke-[1.5]" />
              ) : (
                <Mic className="size-4 stroke-[1.5]" />
              )}
            </TalkIconControl>
            <TalkIconControl
              ariaLabel={
                cameraEnabled
                  ? t("controls.turnOffCamera")
                  : t("controls.turnOnCamera")
              }
              disabled={sessionBusy}
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
              disabled={sessionBusy}
              variant="outline"
              className="h-11 rounded-full border-white/12 bg-white/4 px-5 text-sm text-white hover:bg-white/8"
              onClick={() => {
                void handleStop();
              }}
            >
              <Square className="size-4" />
              {isStopping ? t("stopping") : t("stopSession")}
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

export type EmployeeTalkSessionInputProps = {
  chatSession: TalkChatCredentials;
  employeeId: string;
  avatarPreviewUrl: string | null;
  sessionLimitSeconds: number;
};

export type EmployeeTalkRoomProps = EmployeeTalkSessionInputProps & {
  employeeName: string;
  activeSession: ActiveTalkSession | null;
  onActiveSessionChange: (session: ActiveTalkSession | null) => void;
};

function TalkRoomLayout({
  chatSession,
  employeeName,
  employeeId,
  avatarPreviewUrl,
  activeSession,
  onActiveSessionChange,
}: EmployeeTalkRoomProps) {
  const [cameraEnabled, setCameraEnabled] = useState(false);

  return (
    <div className="employee-talk-workspace w-full">
      <div className="employee-talk-grid grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
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
              userName={chatSession.userName}
            />
          </div>
          <TalkControlsBar
            cameraEnabled={cameraEnabled}
            employeeId={employeeId}
            activeSession={activeSession}
            onSessionStarted={onActiveSessionChange}
            onSessionStopped={() => onActiveSessionChange(null)}
            onCameraToggle={() => setCameraEnabled((current) => !current)}
          />
        </div>

        <div className="employee-talk-chat-panel flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] lg:min-h-0 lg:self-stretch">
          <EmployeeTalkChat
            chatSession={chatSession}
            employeeId={employeeId}
            isSessionLive={Boolean(activeSession)}
            voiceMode={activeSession?.voiceMode ?? "anam"}
          />
        </div>
      </div>
    </div>
  );
}

export function EmployeeTalkRoom(props: EmployeeTalkRoomProps) {
  return <TalkRoomLayout {...props} />;
}
