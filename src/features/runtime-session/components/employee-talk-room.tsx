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
import type { TalkSessionCredentials } from "../services/create-talk-session";
import type { TalkChatCredentials } from "../services/create-talk-chat-session";
import { TalkAnamProvider, useTalkAnam } from "../context/talk-anam-context";
import { EmployeeAnamStage } from "./employee-anam-stage";
import { EmployeeTalkChat } from "./employee-talk-chat";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/css/index.css";
import "./employee-talk-theme.css";

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
    <div className="absolute right-3 bottom-3 z-30 w-36 overflow-hidden rounded-lg border border-white/15 bg-black shadow-md">
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

function TalkStreamBridge({
  streamSession,
  cameraEnabled,
}: {
  streamSession: TalkSessionCredentials;
  cameraEnabled: boolean;
}) {
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
  employeeId,
}: {
  streamSession: TalkSessionCredentials;
  employeeId: string;
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
        <TalkStreamBridge
          streamSession={streamSession}
          cameraEnabled={cameraEnabled}
        />
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-3 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isLive || isLeaving}
            className="h-8 border-white/15 bg-transparent px-3 text-white hover:bg-white/5"
            onClick={toggleMic}
          >
            {micMuted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
            Mic
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLeaving}
            className="h-8 border-white/15 bg-transparent px-3 text-white hover:bg-white/5"
            onClick={() => {
              void handleToggleCamera();
            }}
          >
            {cameraEnabled ? (
              <Video className="size-3.5" />
            ) : (
              <VideoOff className="size-3.5" />
            )}
            Video
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLeaving}
            className="h-8 bg-white px-3 text-black hover:bg-white/90"
            onClick={() => {
              void handleLeave();
            }}
          >
            <PhoneOff className="size-3.5" />
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
    <div className="employee-talk-shell flex flex-col gap-3">
      <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="employee-talk-stage-wrap relative mx-auto w-full max-w-2xl">
            <EmployeeAnamStage
              employeeId={employeeId}
              employeeName={employeeName}
              avatarPreviewUrl={avatarPreviewUrl}
            />
          </div>
          <TalkControlsBar
            streamSession={streamSession}
            employeeId={employeeId}
          />
        </div>

        <div className="employee-talk-chat-panel flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] lg:min-h-0 lg:h-full">
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
