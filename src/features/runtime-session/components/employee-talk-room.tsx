"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { useTalkAnam } from "../context/talk-anam-context";
import {
  completeTalkSessionAction,
} from "../actions/employee-session";
import { EmployeeAnamStage } from "./employee-anam-stage";
import { EmployeeTalkChat } from "./employee-talk-chat";
import { TalkLocalCameraPip } from "./talk-local-camera-pip";
import "stream-chat-react/css/index.css";
import "./employee-talk-theme.css";

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
  employeeSessionId,
}: {
  cameraEnabled: boolean;
  onCameraToggle: () => void;
  employeeSessionId: string;
}) {
  const router = useRouter();
  const { micMuted, toggleMic, stopSession, isLive } = useTalkAnam();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await stopSession();
      await completeTalkSessionAction(employeeSessionId);
    } finally {
      router.push("/dashboard/employees");
    }
  }, [employeeSessionId, router, stopSession]);

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <TalkIconControl
        ariaLabel={micMuted ? "Unmute microphone" : "Mute microphone"}
        disabled={!isLive || isLeaving}
        onClick={toggleMic}
      >
        {micMuted ? (
          <MicOff className="size-4 stroke-[1.5]" />
        ) : (
          <Mic className="size-4 stroke-[1.5]" />
        )}
      </TalkIconControl>
      <TalkIconControl
        ariaLabel={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        disabled={isLeaving}
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
        disabled={isLeaving}
        variant="destructive"
        className="h-11 rounded-full px-5 text-sm"
        onClick={() => {
          void handleLeave();
        }}
      >
        <PhoneOff className="size-4" />
        Leave
      </Button>
    </div>
  );
}

export type EmployeeTalkRoomProps = {
  chatSession: TalkChatCredentials;
  anamSessionToken: string;
  employeeName: string;
  employeeId: string;
  employeeSessionId: string;
  avatarPreviewUrl: string | null;
  sessionLimitSeconds: number;
};

function TalkRoomLayout({
  chatSession,
  employeeName,
  employeeId,
  employeeSessionId,
  avatarPreviewUrl,
  anamSessionToken,
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
              employeeSessionId={employeeSessionId}
              avatarPreviewUrl={avatarPreviewUrl}
              sessionToken={anamSessionToken}
            />
            <TalkLocalCameraPip
              enabled={cameraEnabled}
              userName={chatSession.userName}
            />
          </div>
          <TalkControlsBar
            cameraEnabled={cameraEnabled}
            employeeSessionId={employeeSessionId}
            onCameraToggle={() => setCameraEnabled((current) => !current)}
          />
        </div>

        <div className="employee-talk-chat-panel flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] lg:min-h-0 lg:self-stretch">
          <EmployeeTalkChat chatSession={chatSession} />
        </div>
      </div>
    </div>
  );
}

export function EmployeeTalkRoom(props: EmployeeTalkRoomProps) {
  return <TalkRoomLayout {...props} />;
}
