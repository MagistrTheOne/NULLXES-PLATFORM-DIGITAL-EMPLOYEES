"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CallingState,
  ParticipantView,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  type User,
} from "@stream-io/video-react-sdk";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TalkSessionCredentials } from "../services/create-talk-session";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { TalkAnamProvider, useTalkAnam } from "../context/talk-anam-context";
import { EmployeeAnamStage } from "./employee-anam-stage";
import { EmployeeTalkChat } from "./employee-talk-chat";
import "@stream-io/video-react-sdk/dist/css/styles.css";
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

function TalkStreamPip() {
  const { useLocalParticipant, useCallCallingState, useCameraState } =
    useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const callingState = useCallCallingState();
  const { status: cameraStatus } = useCameraState();

  if (
    cameraStatus !== "enabled" ||
    !localParticipant ||
    callingState !== CallingState.JOINED
  ) {
    return null;
  }

  return (
    <div className="absolute right-3 bottom-3 z-30 w-32 overflow-hidden rounded-lg border border-white/15 bg-black/80 shadow-md">
      <div className="relative aspect-video bg-[#111111]">
        <ParticipantView
          participant={localParticipant}
          className="employee-talk-participant employee-talk-pip"
        />
      </div>
      <p className="truncate px-2 py-1 text-[10px] text-white/55">You</p>
    </div>
  );
}

function TalkStreamBridge({ cameraEnabled }: { cameraEnabled: boolean }) {
  const call = useCall();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!call || !cameraEnabled) {
      return;
    }

    if (joinedRef.current) {
      void call.camera.enable().catch(() => undefined);
      return;
    }

    const activeCall = call;
    joinedRef.current = true;
    let active = true;

    async function joinForCamera(): Promise<void> {
      try {
        await activeCall.camera.disable();
        await activeCall.microphone.disable();
      } catch {
        // ignore
      }

      if (!active) {
        return;
      }

      await activeCall.join({ create: false });
      await activeCall.camera.enable();
    }

    void joinForCamera().catch((error: unknown) => {
      console.error("Failed to join Stream for camera", error);
    });

    return () => {
      active = false;
    };
  }, [call, cameraEnabled]);

  useEffect(() => {
    if (!call || cameraEnabled) {
      return;
    }

    void call.camera.disable().catch(() => undefined);
  }, [call, cameraEnabled]);

  return <TalkStreamPip />;
}

function TalkControlsBar({
  streamSession,
}: {
  streamSession: TalkSessionCredentials;
}) {
  const router = useRouter();
  const { micMuted, toggleMic, stopSession, isLive } = useTalkAnam();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const streamUser: User = useMemo(
    () => ({
      id: streamSession.userId,
      name: streamSession.userName,
    }),
    [streamSession.userId, streamSession.userName],
  );

  const videoClient = useMemo(
    () =>
      StreamVideoClient.getOrCreateInstance({
        apiKey: streamSession.apiKey,
        user: streamUser,
        token: streamSession.token,
      }),
    [streamSession.apiKey, streamSession.token, streamUser],
  );

  const videoCall = useMemo(
    () => videoClient.call(streamSession.callType, streamSession.callId),
    [videoClient, streamSession.callType, streamSession.callId],
  );

  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await stopSession();
      await videoCall.leave().catch(() => undefined);
    } finally {
      router.push("/dashboard/employees");
    }
  }, [router, stopSession, videoCall]);

  const handleToggleCamera = useCallback(async () => {
    if (cameraEnabled) {
      setCameraEnabled(false);
      await videoCall.camera.disable().catch(() => undefined);
      return;
    }

    setCameraEnabled(true);
  }, [cameraEnabled, videoCall]);

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={videoCall}>
        <TalkStreamBridge cameraEnabled={cameraEnabled} />
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
            onClick={() => {
              void handleToggleCamera();
            }}
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
      </StreamCall>
    </StreamVideo>
  );
}

export type EmployeeTalkRoomProps = {
  streamSession: TalkSessionCredentials;
  chatSession: TalkChatCredentials;
  employeeName: string;
  employeeId: string;
  avatarPreviewUrl: string | null;
};

function TalkRoomLayout({
  streamSession,
  chatSession,
  employeeName,
  employeeId,
  avatarPreviewUrl,
}: EmployeeTalkRoomProps) {
  return (
    <div className="employee-talk-workspace w-full">
      <div className="employee-talk-grid grid min-h-[min(68vh,560px)] gap-4 lg:grid-cols-[7fr_3fr]">
        <div className="employee-talk-primary flex min-h-0 flex-col gap-2">
          <div className="employee-talk-stage-wrap relative min-h-0 flex-1">
            <EmployeeAnamStage
              employeeId={employeeId}
              employeeName={employeeName}
              avatarPreviewUrl={avatarPreviewUrl}
            />
          </div>
          <TalkControlsBar streamSession={streamSession} />
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
