"use client";

import { useEffect, useRef } from "react";
import {
  AudioLines,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { XaiVoiceCallVisual } from "@/features/xai-voice/components/xai-voice-call-visual";
import { useXaiVoiceSession } from "@/features/xai-voice/hooks/use-xai-voice-session";
import { cn } from "@/lib/utils";

function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function XaiVoiceCallSheet({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  avatarPreviewUrl,
  sessionId,
  translationNamespace = "conversations.xaiVoice",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  avatarPreviewUrl?: string | null;
  sessionId?: string;
  translationNamespace?: string;
}) {
  const t = useTranslations(translationNamespace);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const {
    state,
    error,
    transcript,
    start,
    stop,
    isLive,
    isAssistantSpeaking,
    callDurationSec,
    micMuted,
    speakerMuted,
    toggleMicMute,
    toggleSpeakerMute,
  } = useXaiVoiceSession({
    employeeId,
    sessionId,
    enabled: open,
  });

  const isSessionLocked = isLive || state === "connecting";
  const canLeaveWithoutEnding = !isSessionLocked;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript]);

  const handleExit = () => {
    stop();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (!canLeaveWithoutEnding) {
      return;
    }

    handleExit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fixed inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#050505] p-0 text-white ring-0",
          "data-open:zoom-in-100 data-closed:zoom-out-100",
        )}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <header
            className={cn(
              "relative flex shrink-0 items-start border-b border-white/8 px-5 py-4 sm:px-8",
              isLive ? "justify-center py-5" : "justify-between gap-4",
            )}
          >
            {isLive ? (
              <div className="space-y-1 text-center">
                <DialogTitle className="text-lg font-medium tracking-tight text-white sm:text-xl">
                  {employeeName}
                </DialogTitle>
                <p className="font-mono text-sm tabular-nums text-white/55 sm:text-base">
                  {formatCallDuration(callDurationSec)}
                </p>
              </div>
            ) : (
              <>
                <div className="min-w-0">
                  <DialogTitle className="sr-only">{employeeName}</DialogTitle>
                  <DialogDescription className="text-xs text-white/45 sm:text-sm">
                    {t("subtitle")}
                  </DialogDescription>
                </div>

                {canLeaveWithoutEnding ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-4 right-5 text-white/55 hover:bg-white/8 hover:text-white sm:right-8"
                    aria-label={t("close")}
                    onClick={handleExit}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </>
            )}
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 sm:px-8">
              <XaiVoiceCallVisual
                name={employeeName}
                avatarPreviewUrl={avatarPreviewUrl}
                speaking={isLive && isAssistantSpeaking}
                variant="stage"
              />

              <p
                className={cn(
                  "mt-10 text-center text-base font-medium tracking-tight text-white/90 sm:mt-12 sm:text-lg",
                  isLive && "sr-only",
                )}
              >
                {employeeName}
              </p>

              <div className="mt-12 flex items-center justify-center gap-4 sm:mt-14 sm:gap-5">
                {!isLive ? (
                  <Button
                    type="button"
                    className="h-[52px] rounded-full border border-white/10 bg-white px-10 text-sm font-medium text-black shadow-none hover:bg-white/92 sm:px-12"
                    disabled={state === "connecting"}
                    onClick={() => void start()}
                  >
                    {state === "connecting" ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        <Mic className="mr-2.5 size-4" />
                        {t("startCall")}
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={micMuted ? t("unmuteMic") : t("muteMic")}
                      onClick={toggleMicMute}
                      className={cn(
                        "flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10",
                        micMuted && "border-red-400/25 text-red-200/90",
                      )}
                    >
                      {micMuted ? (
                        <MicOff className="size-5" />
                      ) : (
                        <Mic className="size-5" />
                      )}
                    </button>

                    <Button
                      type="button"
                      className="h-[52px] rounded-full border border-white/10 bg-white px-10 text-sm font-medium text-black shadow-none hover:bg-white/92 sm:px-12"
                      onClick={() => stop()}
                    >
                      <AudioLines className="mr-2.5 size-4" />
                      {t("endCall")}
                    </Button>

                    <button
                      type="button"
                      aria-label={
                        speakerMuted ? t("unmuteSpeaker") : t("muteSpeaker")
                      }
                      onClick={toggleSpeakerMute}
                      className={cn(
                        "flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10",
                        speakerMuted && "border-amber-300/25 text-amber-100/90",
                      )}
                    >
                      {speakerMuted ? (
                        <VolumeX className="size-5" />
                      ) : (
                        <Volume2 className="size-5" />
                      )}
                    </button>
                  </>
                )}
              </div>

              {error ? (
                <p className="mt-6 text-sm text-red-300/90" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="shrink-0 px-5 pt-2 pb-6 sm:px-8 sm:pb-8">
              <div className="mx-auto max-h-[min(24dvh,220px)] min-h-[96px] overflow-y-auto">
                {transcript.length > 0 ? (
                  <div className="space-y-2 text-sm leading-6 text-white/65 sm:text-[15px]">
                    {transcript.map((line, index) => (
                      <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                ) : (
                  <p className="py-6 text-center text-xs text-white/30 sm:text-sm">
                    {t("transcriptEmpty")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!isLive ? (
            <footer className="flex shrink-0 items-center justify-between border-t border-white/8 px-5 py-3 text-[11px] text-white/35 sm:px-8 sm:text-xs">
              <span>{t("subtitle")}</span>
              {state === "ended" || state === "error" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-white/55 hover:bg-white/8 hover:text-white"
                  onClick={handleExit}
                >
                  {t("close")}
                </Button>
              ) : null}
            </footer>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
