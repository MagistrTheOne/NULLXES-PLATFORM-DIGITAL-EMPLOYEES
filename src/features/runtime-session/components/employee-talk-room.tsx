"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { StreamChat } from "stream-chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TalkSessionCredentials } from "../services/create-talk-session";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { TalkAnamProvider, useTalkAnam } from "../context/talk-anam-context";
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
        "flex size-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/4 text-white transition-colors",
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
}: {
  cameraEnabled: boolean;
  onCameraToggle: () => void;
}) {
  const router = useRouter();
  const { micMuted, toggleMic, stopSession, isLive } = useTalkAnam();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await stopSession();
    } finally {
      router.push("/dashboard/employees");
    }
  }, [router, stopSession]);

  return (
    <div className="flex items-center justify-center gap-3 py-3">
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
        className="h-10 rounded-full border border-white/12 bg-white/6 px-4 text-sm text-white hover:bg-white/10"
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
  streamSession: TalkSessionCredentials;
  chatSession: TalkChatCredentials;
  anamSessionToken: string;
  employeeName: string;
  employeeId: string;
  avatarPreviewUrl: string | null;
};

function TalkRoomLayout({
  chatSession,
  employeeName,
  employeeId,
  avatarPreviewUrl,
  anamSessionToken,
  streamSession,
}: EmployeeTalkRoomProps) {
  void streamSession;

  const [cameraEnabled, setCameraEnabled] = useState(false);

  useEffect(() => {
    const apiKey = chatSession.apiKey;

    return () => {
      const chatClient = StreamChat.getInstance(apiKey);
      void chatClient.disconnectUser().catch(() => undefined);
    };
  }, [chatSession.apiKey]);

  return (
    <div className="employee-talk-workspace w-full">
      <div className="employee-talk-grid grid min-h-[min(68vh,560px)] gap-4 lg:grid-cols-[7fr_3fr]">
        <div className="employee-talk-primary flex min-h-0 flex-col gap-2">
          <div className="employee-talk-stage-wrap relative min-h-0 flex-1">
            <EmployeeAnamStage
              employeeId={employeeId}
              employeeName={employeeName}
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
            onCameraToggle={() => setCameraEnabled((current) => !current)}
          />
        </div>

        <div className="employee-talk-chat-panel flex min-h-[240px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] lg:min-h-0">
          <EmployeeTalkChat chatSession={chatSession} />
        </div>
      </div>
    </div>
  );
}

export function EmployeeTalkRoom(props: EmployeeTalkRoomProps) {
  return (
    <TalkAnamProvider>
      <TalkRoomLayout {...props} />
    </TalkAnamProvider>
  );
}
