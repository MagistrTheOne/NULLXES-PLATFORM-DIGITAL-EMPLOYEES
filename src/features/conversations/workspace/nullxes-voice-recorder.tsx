"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Mic, Trash2 } from "lucide-react";
import {
  useMessageComposerContext,
  useMessageComposerController,
} from "stream-chat-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transcribeVoiceMessageAction } from "@/features/runtime-session/actions/transcribe-voice-message";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function NullxesVoiceRecorder() {
  const t = useTranslations("conversations.voice");
  const { handleSubmit, recordingController } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const { recorder, recording, recordingState } = recordingController;

  const [elapsed, setElapsed] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isStopped = recordingState === "stopped";

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const base = recording?.duration ?? 0;
      setElapsed(base + (Date.now() - startedAt) / 1000);
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [isRecording, recording?.duration]);

  useEffect(() => {
    if (isRecording) {
      setElapsed(recording?.duration ?? 0);
    }
  }, [isRecording, recording?.duration]);

  const handleCancel = useCallback(() => {
    recorder?.cancel();
    setError(null);
    setElapsed(0);
  }, [recorder]);

  const handleComplete = useCallback(async () => {
    if (!recorder || processing) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const voiceRecording = await recorder.stop();
      if (!voiceRecording?.localMetadata?.file) {
        setError(t("noAudio"));
        return;
      }

      const file = voiceRecording.localMetadata.file as File;
      const formData = new FormData();
      formData.append("audio", file);

      const result = await transcribeVoiceMessageAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      messageComposer.textComposer.setText(result.transcript);
      await messageComposer.attachmentManager.uploadAttachment(voiceRecording);
      handleSubmit();
      recorder.cleanUp();
      setElapsed(0);
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : t("transcribeFailed"),
      );
    } finally {
      setProcessing(false);
    }
  }, [handleSubmit, messageComposer, processing, recorder, t]);

  if (!recorder) {
    return null;
  }

  const displayDuration =
    isStopped || isPaused
      ? (recording?.duration ?? elapsed)
      : elapsed;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-[#0a0a0a] px-4 py-3",
        )}
      >
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10",
            isRecording && "animate-pulse bg-white/6",
          )}
        >
          <Mic
            className={cn(
              "size-4 stroke-[1.5]",
              isRecording ? "text-white" : "text-white/45",
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-white/85">
            {processing
              ? t("transcribing")
              : isRecording
                ? t("recording")
                : isPaused
                  ? t("paused")
                  : t("review")}
          </p>
          <p className="text-xs tabular-nums text-white/35">
            {formatDuration(displayDuration)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={processing}
            onClick={handleCancel}
            className="size-9 text-white/45 hover:bg-white/4 hover:text-white"
            aria-label={t("cancel")}
          >
            <Trash2 className="size-4 stroke-[1.5]" />
          </Button>

          {isRecording || isPaused ? (
            <Button
              type="button"
              size="icon-sm"
              disabled={processing}
              onClick={() => {
                void handleComplete();
              }}
              className="size-9 rounded-full bg-white text-black hover:bg-white/90"
              aria-label={t("send")}
            >
              {processing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4 stroke-2" />
              )}
            </Button>
          ) : isStopped ? (
            <Button
              type="button"
              size="icon-sm"
              disabled={processing}
              onClick={() => {
                void handleComplete();
              }}
              className="size-9 rounded-full bg-white text-black hover:bg-white/90"
              aria-label={t("send")}
            >
              {processing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4 stroke-2" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="px-1 text-xs text-white/50">{error}</p>
      ) : null}
    </div>
  );
}
