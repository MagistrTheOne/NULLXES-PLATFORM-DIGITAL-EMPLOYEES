"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalkSessionCredentials } from "../services/create-talk-session";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./employee-talk-theme.css";

function TalkCallControls({
  employeeName,
  employeeId,
}: {
  employeeName: string;
  employeeId: string;
}) {
  const call = useCall();
  const { useCameraState, useMicrophoneState, useCallCallingState } =
    useCallStateHooks();
  const { status: cameraStatus } = useCameraState();
  const { status: micStatus } = useMicrophoneState();
  const callingState = useCallCallingState();

  if (!call || callingState !== CallingState.JOINED) {
    return (
      <p className="text-sm text-white/50">
        Connecting to {employeeName}…
      </p>
    );
  }

  const cameraOn = cameraStatus === "enabled";
  const micOn = micStatus === "enabled";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="border-white/15 bg-transparent text-white hover:bg-white/5"
        onClick={() => call.camera.toggle()}
      >
        {cameraOn ? (
          <Video className="size-4" />
        ) : (
          <VideoOff className="size-4" />
        )}
        Camera
      </Button>
      <Button
        type="button"
        variant="outline"
        className="border-white/15 bg-transparent text-white hover:bg-white/5"
        onClick={() => call.microphone.toggle()}
      >
        {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        Mic
      </Button>
      <Button
        type="button"
        className="bg-white text-black hover:bg-white/90"
        onClick={() => {
          void call.leave();
        }}
        asChild
      >
        <Link href={`/dashboard/employees/${employeeId}`}>
          <PhoneOff className="size-4" />
          Leave
        </Link>
      </Button>
    </div>
  );
}

function TalkParticipantGrid() {
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();

  const ordered = [
    ...participants.filter((p) => p.sessionId !== localParticipant?.sessionId),
    ...(localParticipant ? [localParticipant] : []),
  ];

  return (
    <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
      {ordered.map((participant) => (
        <div
          key={participant.sessionId}
          className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
        >
          <ParticipantView
            participant={participant}
            className="employee-talk-participant"
          />
        </div>
      ))}
    </div>
  );
}

function TalkCallSession({
  session,
}: {
  session: TalkSessionCredentials;
}) {
  const call = useCall();

  useEffect(() => {
    if (!call) {
      return;
    }

    let active = true;

    void call.join({ create: false }).catch((error: unknown) => {
      if (active) {
        console.error("Failed to join talk session", error);
      }
    });

    return () => {
      active = false;
      void call.leave().catch(() => undefined);
    };
  }, [call]);

  return (
    <div className="flex min-h-[70vh] flex-col rounded-2xl border border-white/10 bg-black">
      <TalkParticipantGrid />
      <div className="border-t border-white/10 px-4 py-5">
        <TalkCallControls
          employeeName={session.employeeName}
          employeeId={session.employeeId}
        />
      </div>
    </div>
  );
}

export function EmployeeTalkRoom({
  session,
}: {
  session: TalkSessionCredentials;
}) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<ReturnType<StreamVideoClient["call"]> | null>(
    null,
  );

  useEffect(() => {
    const user: User = {
      id: session.userId,
      name: session.userName,
    };

    const videoClient = new StreamVideoClient({
      apiKey: session.apiKey,
      user,
      token: session.token,
    });

    const videoCall = videoClient.call(session.callType, session.callId);

    setClient(videoClient);
    setCall(videoCall);

    return () => {
      void videoCall.leave().catch(() => undefined);
      void videoClient.disconnectUser().catch(() => undefined);
      setClient(null);
      setCall(null);
    };
  }, [session]);

  if (!client || !call) {
    return (
      <p className="text-sm text-white/50">Preparing talk session…</p>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <TalkCallSession session={session} />
      </StreamCall>
    </StreamVideo>
  );
}
