"use client";

import { useEffect, useRef } from "react";
import {
  AudioLines,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    isAssistantThinking,
    isAssistantSpeaking,
    isRunningTool,
    activeToolName,
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

  const connected = isLive || state === "connecting";
  const visualActive =
    isLive && (isAssistantSpeaking || isAssistantThinking || isRunningTool);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript, isAssistantThinking]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      stop();
    }
    onOpenChange(nextOpen);
  };

  const statusLabel =
    state === "live"
      ? t("connected")
      : state === "connecting"
        ? t("statusConnecting")
        : state === "error"
          ? t("statusError")
          : state === "ended"
            ? t("statusEnded")
            : t("statusIdle");

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[min(92dvh,720px)] flex-col gap-0 overflow-hidden border-white/10 bg-[#080808] p-0 text-white sm:max-h-[min(88dvh,680px)]"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-white/8 px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-4 pe-8">
            <div className="min-w-0 space-y-1">
              <SheetTitle className="text-base font-medium">
                {t("title", { name: employeeName })}
              </SheetTitle>
              <SheetDescription className="text-xs leading-5 text-white/50">
                {t("description")}
              </SheetDescription>
            </div>
            <div className="shrink-0 text-right">
              {connected && state !== "idle" ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {statusLabel}
                  </span>
                  <span className="text-[10px] tracking-[0.12em] text-white/40 uppercase">
                    {t("voiceMode")}
                  </span>
                  {isLive ? (
                    <span className="font-mono text-xs tabular-nums text-white/70">
                      {formatCallDuration(callDurationSec)}
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="text-xs text-white/45">{statusLabel}</span>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-5 pt-4">
            <XaiVoiceCallVisual
              name={employeeName}
              avatarPreviewUrl={avatarPreviewUrl}
              active={visualActive}
              connected={connected}
            />
          </div>

          <div className="flex shrink-0 items-center justify-center gap-4 px-5 py-4">
            {!isLive ? (
              <Button
                type="button"
                size="lg"
                className="h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90"
                disabled={state === "connecting"}
                onClick={() => void start()}
              >
                {state === "connecting" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("connecting")}
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 size-4" />
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
                    "flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white transition hover:bg-white/10",
                    micMuted && "border-red-400/30 text-red-200",
                  )}
                >
                  {micMuted ? (
                    <MicOff className="size-4" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </button>

                <Button
                  type="button"
                  size="lg"
                  className="h-11 rounded-full bg-white px-6 text-sm font-medium text-black hover:bg-white/90"
                  onClick={() => stop()}
                >
                  <AudioLines className="mr-2 size-4" />
                  {t("endCall")}
                </Button>

                <button
                  type="button"
                  aria-label={
                    speakerMuted ? t("unmuteSpeaker") : t("muteSpeaker")
                  }
                  onClick={toggleSpeakerMute}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white transition hover:bg-white/10",
                    speakerMuted && "border-amber-300/30 text-amber-100",
                  )}
                >
                  {speakerMuted ? (
                    <VolumeX className="size-4" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
              </>
            )}
          </div>

          {error ? (
            <p className="px-5 pb-2 text-sm text-red-300/90" role="alert">
              {error}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
            {transcript.length > 0 || isAssistantThinking || isRunningTool ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/78">
                {transcript.map((line, index) => (
                  <p key={`${index}-${line.slice(0, 12)}`} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
                {isRunningTool && activeToolName ? (
                  <p className="text-white/45">
                    {t("usingTool", { tool: activeToolName })}
                  </p>
                ) : isAssistantThinking ? (
                  <p className="text-white/45">
                    {t("thinking", { name: employeeName })}
                    <span className="inline-flex gap-0.5 pl-1">
                      <span className="animate-pulse">·</span>
                      <span className="animate-pulse [animation-delay:150ms]">·</span>
                      <span className="animate-pulse [animation-delay:300ms]">·</span>
                    </span>
                  </p>
                ) : null}
                <div ref={transcriptEndRef} />
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-white/35">
                {t("transcriptEmpty")}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-white/8 px-5 py-3 text-[11px] text-white/40">
            <span>
              {t("voiceMode")} · {t("providerLabel")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PhoneOff className="size-3 opacity-60" />
              {t("autoTranscript")}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
