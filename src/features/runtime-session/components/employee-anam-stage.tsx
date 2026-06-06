"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnamEvent, createClient } from "@anam-ai/js-sdk";
import { Loader2 } from "lucide-react";
import {
  activateTalkSessionAction,
  failTalkSessionAction,
} from "@/features/runtime-session/actions/employee-session";
import { useTalkAnam } from "@/features/runtime-session/context/talk-anam-context";
import { attachTalkVoicePipeline } from "@/features/runtime-session/lib/attach-talk-voice-pipeline";
import type { TalkVoiceMode } from "@/features/runtime-session/services/resolve-talk-voice-mode";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { TalkStageChrome } from "./talk-stage-chrome";

const ANAM_VIDEO_ELEMENT_ID = "nullxes-anam-persona-video";

export function EmployeeAnamStage({
  employeeId,
  employeeName,
  employeeSessionId,
  avatarPreviewUrl,
  sessionToken,
  voiceMode,
}: {
  employeeId: string;
  employeeName: string;
  employeeSessionId: string;
  avatarPreviewUrl: string | null;
  sessionToken: string | null;
  voiceMode: TalkVoiceMode;
}) {
  const t = useTranslations("employees.talk");
  const { registerClient, setIsLive, isStoppingIntentionally } = useTalkAnam();
  const [status, setStatus] = useState<
    "idle" | "connecting" | "live" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) {
      setStatus("idle");
      setErrorMessage(null);
      setIsLive(false);
      registerClient(null);
      return;
    }

    const token = sessionToken;
    let disposed = false;
    let detachVoicePipeline: (() => void) | null = null;

    async function startAnamSession(): Promise<void> {
      setStatus("connecting");
      setErrorMessage(null);
      setIsLive(false);

      const anamClient = createClient(token);
      registerClient(anamClient);

      anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        if (!disposed) {
          setStatus("live");
          setIsLive(true);
          void activateTalkSessionAction(employeeSessionId);
        }
      });

      anamClient.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        if (!disposed && !isStoppingIntentionally()) {
          setStatus("error");
          setIsLive(false);
          setErrorMessage(t("stage.anamClosed"));
          void failTalkSessionAction(employeeSessionId);
        }
      });

      try {
        await anamClient.streamToVideoElement(ANAM_VIDEO_ELEMENT_ID);
        if (!disposed) {
          detachVoicePipeline = attachTalkVoicePipeline({
            anamClient,
            employeeId,
            voiceMode,
          });
        }
      } catch (error: unknown) {
        if (!disposed && !isStoppingIntentionally()) {
          setStatus("error");
          setIsLive(false);
          setErrorMessage(
            error instanceof Error ? error.message : t("stage.anamStreamFailed"),
          );
          void failTalkSessionAction(employeeSessionId);
        }
      }
    }

    void startAnamSession();

    return () => {
      disposed = true;
      detachVoicePipeline?.();
      registerClient(null);
    };
  }, [
    employeeId,
    employeeSessionId,
    isStoppingIntentionally,
    registerClient,
    sessionToken,
    setIsLive,
    t,
    voiceMode,
  ]);

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
          <p className="text-xs text-white/55">{t("connecting")}</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/85 px-3 py-2">
          <p className="text-xs text-white/65" role="alert">
            {errorMessage ?? t("stage.anamUnavailable")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
