"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnamEvent, ConnectionClosedCode } from "@anam-ai/js-sdk";
import { Loader2 } from "lucide-react";
import {
  activateTalkSessionAction,
  failTalkSessionAction,
} from "@/features/runtime-session/actions/employee-session";
import { useTalkAnam } from "@/features/runtime-session/context/talk-anam-context";
import { attachTalkAnamSessionEvents } from "@/features/runtime-session/lib/attach-talk-anam-session-events";
import { attachTalkVoicePipeline } from "@/features/runtime-session/lib/attach-talk-voice-pipeline";
import { createAnamTalkClient } from "@/features/runtime-session/lib/create-anam-talk-client";
import {
  acquireAnamInputAudioStream,
  releaseAnamInputAudioStream,
} from "@/features/runtime-session/lib/acquire-anam-input-audio-stream";
import type { TalkVoiceMode } from "@/features/runtime-session/services/resolve-talk-voice-mode";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { TalkStageHud } from "./talk-stage-hud";

const ANAM_VIDEO_ELEMENT_ID = "nullxes-anam-persona-video";

export function EmployeeAnamStage({
  employeeId,
  employeeName,
  employeeSessionId,
  scenarioSessionId,
  avatarPreviewUrl,
  sessionToken,
  voiceMode,
}: {
  employeeId: string;
  employeeName: string;
  employeeSessionId: string;
  scenarioSessionId?: string;
  avatarPreviewUrl: string | null;
  sessionToken: string | null;
  voiceMode: TalkVoiceMode;
}) {
  const t = useTranslations("employees.talk");
  const translationsRef = useRef({
    micPermissionDenied: t("stage.micPermissionDenied"),
    anamClosed: t("stage.anamClosed"),
    anamStreamFailed: t("stage.anamStreamFailed"),
  });
  translationsRef.current = {
    micPermissionDenied: t("stage.micPermissionDenied"),
    anamClosed: t("stage.anamClosed"),
    anamStreamFailed: t("stage.anamStreamFailed"),
  };
  const {
    registerClient,
    setIsLive,
    setPipelineState,
    setMicPermission,
    syncMicFromClient,
    ensureMicActive,
    isStoppingIntentionally,
  } = useTalkAnam();
  const [status, setStatus] = useState<
    "idle" | "connecting" | "live" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) {
      setStatus("idle");
      setErrorMessage(null);
      setIsLive(false);
      setPipelineState("idle");
      registerClient(null);
      return;
    }

    const token = sessionToken;
    let disposed = false;
    let startGeneration = 0;
    let activeClient: ReturnType<typeof createAnamTalkClient> | null = null;
    let inputAudioStream: MediaStream | null = null;
    let detachVoicePipeline: (() => void) | null = null;
    let detachSessionEvents: (() => void) | null = null;

    async function startAnamSession(): Promise<void> {
      const generation = ++startGeneration;

      setStatus("connecting");
      setErrorMessage(null);
      setIsLive(false);
      setPipelineState("idle");

      const anamClient = createAnamTalkClient(token);
      if (disposed || generation !== startGeneration) {
        await anamClient.stopStreaming().catch(() => undefined);
        return;
      }

      activeClient = anamClient;
      registerClient(anamClient);

      anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        if (disposed || generation !== startGeneration) {
          return;
        }

        setStatus("live");
        setIsLive(true);
        setPipelineState("idle");
        ensureMicActive();
        syncMicFromClient();
        void activateTalkSessionAction(employeeSessionId);
      });

      detachSessionEvents = attachTalkAnamSessionEvents({
        anamClient,
        setPipelineState,
        setMicPermission,
        syncMicFromClient,
        ensureMicActive,
        onConnectionClosed: (reason, details) => {
          if (
            disposed ||
            generation !== startGeneration ||
            isStoppingIntentionally()
          ) {
            return;
          }

          if (reason === ConnectionClosedCode.MICROPHONE_PERMISSION_DENIED) {
            setErrorMessage(translationsRef.current.micPermissionDenied);
          } else {
            setErrorMessage(
              details?.trim()
                ? details
                : translationsRef.current.anamClosed,
            );
          }

          setStatus("error");
          setIsLive(false);
          void failTalkSessionAction(employeeSessionId);
        },
      });

      detachVoicePipeline = attachTalkVoicePipeline({
        anamClient,
        employeeId,
        employeeSessionId,
        scenarioSessionId,
        voiceMode,
        setPipelineState,
      });

      // Anam SDK: pass a dedicated input MediaStream for reliable mic capture.
      // @see https://anam.ai/docs/javascript-sdk/reference/audio-control
      try {
        setMicPermission("pending");
        inputAudioStream = await acquireAnamInputAudioStream();
        if (disposed || generation !== startGeneration) {
          releaseAnamInputAudioStream(inputAudioStream);
          inputAudioStream = null;
          return;
        }

        await anamClient.streamToVideoElement(
          ANAM_VIDEO_ELEMENT_ID,
          inputAudioStream,
        );
      } catch (error: unknown) {
        if (
          !disposed &&
          generation === startGeneration &&
          !isStoppingIntentionally()
        ) {
          setStatus("error");
          setIsLive(false);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : translationsRef.current.anamStreamFailed,
          );
          void failTalkSessionAction(employeeSessionId);
        }
      }
    }

    void startAnamSession();

    return () => {
      disposed = true;
      startGeneration += 1;
      detachVoicePipeline?.();
      detachSessionEvents?.();
      releaseAnamInputAudioStream(inputAudioStream);
      inputAudioStream = null;
      const client = activeClient;
      activeClient = null;
      registerClient(null);
      if (client) {
        void client.stopStreaming().catch(() => undefined);
      }
    };
  }, [
    employeeId,
    employeeSessionId,
    isStoppingIntentionally,
    registerClient,
    sessionToken,
    setIsLive,
    setPipelineState,
    voiceMode,
  ]);

  // Keep the live mic indicator honest: poll the SDK's authoritative input
  // audio state while streaming in case a permission/mute event was missed.
  useEffect(() => {
    if (status !== "live") {
      return;
    }
    syncMicFromClient();
    const interval = window.setInterval(syncMicFromClient, 800);
    return () => window.clearInterval(interval);
  }, [status, syncMicFromClient]);

  const showPhotoPlaceholder =
    status !== "live" && Boolean(avatarPreviewUrl);

  return (
    <div className="employee-anam-stage relative flex size-full items-center justify-center overflow-hidden bg-black">
      {showPhotoPlaceholder ? (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="relative size-full">
            <AvatarIdlePreview
              src={avatarPreviewUrl!}
              alt={employeeName}
              sizes="(max-width: 960px) 100vw, 100vw"
              fit="cover"
              className="h-full w-full"
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

      <TalkStageHud employeeName={employeeName} />

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
