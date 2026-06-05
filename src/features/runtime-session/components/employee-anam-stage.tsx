"use client";

import { useEffect, useState } from "react";
import { AnamEvent, createClient } from "@anam-ai/js-sdk";
import { Loader2 } from "lucide-react";
import {
  activateTalkSessionAction,
  failTalkSessionAction,
} from "@/features/runtime-session/actions/employee-session";
import { useTalkAnam } from "@/features/runtime-session/context/talk-anam-context";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { TalkStageChrome } from "./talk-stage-chrome";

const ANAM_VIDEO_ELEMENT_ID = "nullxes-anam-persona-video";

export function EmployeeAnamStage({
  employeeId,
  employeeName,
  employeeSessionId,
  avatarPreviewUrl,
  sessionToken,
}: {
  employeeId: string;
  employeeName: string;
  employeeSessionId: string;
  avatarPreviewUrl: string | null;
  sessionToken: string;
}) {
  const { registerClient, setIsLive } = useTalkAnam();
  const [status, setStatus] = useState<
    "idle" | "connecting" | "live" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function startAnamSession(): Promise<void> {
      setStatus("connecting");
      setErrorMessage(null);
      setIsLive(false);

      const anamClient = createClient(sessionToken);
      registerClient(anamClient);

      anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        if (!disposed) {
          setStatus("live");
          setIsLive(true);
          void activateTalkSessionAction(employeeSessionId);
        }
      });

      anamClient.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        if (!disposed) {
          setStatus("error");
          setIsLive(false);
          setErrorMessage("Anam connection closed");
          void failTalkSessionAction(employeeSessionId);
        }
      });

      try {
        await anamClient.streamToVideoElement(ANAM_VIDEO_ELEMENT_ID);
      } catch (error: unknown) {
        if (!disposed) {
          setStatus("error");
          setIsLive(false);
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to start Anam stream",
          );
          void failTalkSessionAction(employeeSessionId);
        }
      }
    }

    void startAnamSession();

    return () => {
      disposed = true;
      registerClient(null);
    };
  }, [employeeId, employeeSessionId, registerClient, sessionToken, setIsLive]);

  const showPhotoPlaceholder =
    status !== "live" && Boolean(avatarPreviewUrl);

  return (
    <div className="employee-anam-stage relative flex size-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
      {showPhotoPlaceholder ? (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="relative size-full">
            <AvatarIdlePreview
              src={avatarPreviewUrl!}
              alt={employeeName}
              sizes="(max-width: 960px) 100vw"
              className="!object-contain"
            />
          </div>
        </div>
      ) : null}

      <video
        id={ANAM_VIDEO_ELEMENT_ID}
        autoPlay
        playsInline
        className={`employee-anam-video relative z-10 size-full transition-opacity duration-500 ${
          status === "live" ? "opacity-100" : "opacity-0"
        }`}
      />

      <TalkStageChrome employeeName={employeeName} />

      {status === "connecting" ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/55">
          <Loader2 className="size-6 animate-spin text-white/70" />
          <p className="text-xs text-white/55">Connecting…</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/85 px-3 py-2">
          <p className="text-xs text-white/65" role="alert">
            {errorMessage ?? "Anam session unavailable"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
