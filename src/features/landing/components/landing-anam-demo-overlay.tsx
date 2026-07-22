"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnamEvent, ConnectionClosedCode, MessageRole } from "@anam-ai/js-sdk";
import type { MessageStreamEvent } from "@anam-ai/js-sdk";
import { Loader2, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { createAnamTalkClient } from "@/features/runtime-session/lib/create-anam-talk-client";
import {
  acquireAnamInputAudioStream,
  releaseAnamInputAudioStream,
  safeVideoPlay,
  unlockAnamVideoPlayback,
} from "@/features/runtime-session/lib/acquire-anam-input-audio-stream";
import { attachTalkVoicePipeline } from "@/features/runtime-session/lib/attach-talk-voice-pipeline";
import { setLandingDemoProxyToken } from "@/features/runtime-session/lib/patch-anam-browser-fetch";
import type { TalkPipelineState } from "@/features/runtime-session/context/talk-anam-context";
import type { TalkVoiceMode } from "@/features/runtime-session/services/resolve-talk-voice-mode";
import { LANDING_DEMO_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { cn } from "@/lib/utils";

const VIDEO_ID = "nullxes-landing-anam-demo-video";
const DEMO_ENDPOINT = "/api/landing/adeline-demo/talk";
const DEMO_BRAIN_ENDPOINT = "/api/landing/adeline-demo/brain-stream";
const DEMO_TTS_ENDPOINT = "/api/landing/adeline-demo/synthesize";
const DEFAULT_MAX_SEC = 60;
/** Cinema title card before portrait reveal. */
const TITLE_CARD_MS = 1400;

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function pipelineCopy(
  state: TalkPipelineState,
  employeeName: string,
): {
  label: string;
  hint: string;
} {
  switch (state) {
    case "listening":
      return { label: "Listening", hint: `Speak — ${employeeName} hears you` };
    case "thinking":
      return { label: "Thinking", hint: "Preparing a reply" };
    case "speaking":
      return { label: "Speaking", hint: `${employeeName} is responding` };
    default:
      return { label: "Ready", hint: `Speak to ${employeeName}` };
  }
}

function PipelineBars({ active }: { active: boolean }) {
  return (
    <span className="flex h-5 items-end gap-[3px]" aria-hidden>
      {[0.35, 0.7, 1, 0.55, 0.85, 0.45].map((scale, index) => (
        <span
          key={index}
          className={cn(
            "w-[3px] rounded-full bg-white transition-all duration-150",
            active ? "opacity-100" : "opacity-35",
          )}
          style={{
            height: `${scale * 100}%`,
            animation: active
              ? `landing-wave 0.9s ease-in-out ${index * 0.07}s infinite`
              : undefined,
          }}
        />
      ))}
    </span>
  );
}

type DemoPayload = {
  sessionToken: string;
  demoProxyToken?: string;
  maxDurationSec?: number;
  employeeId?: string;
  employeeName?: string;
  employeeRole?: string | null;
  avatarPreviewUrl?: string;
  voiceMode?: TalkVoiceMode;
};

export function LandingAnamDemoOverlay({
  open,
  onOpenChange,
  employeeName,
  avatarPreviewUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  avatarPreviewUrl: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "live" | "ended" | "error"
  >("idle");
  const [intro, setIntro] = useState<"title" | "stage">("title");
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [maxDurationSec, setMaxDurationSec] = useState(DEFAULT_MAX_SEC);
  const [micMuted, setMicMuted] = useState(false);
  const [micPermission, setMicPermission] = useState<
    "unknown" | "pending" | "granted" | "denied"
  >("unknown");
  const [pipelineState, setPipelineState] =
    useState<TalkPipelineState>("idle");
  const [liveName, setLiveName] = useState(employeeName);
  const [livePreview, setLivePreview] = useState(avatarPreviewUrl);
  const [liveRole, setLiveRole] = useState<string | null>(null);

  const clientRef = useRef<ReturnType<typeof createAnamTalkClient> | null>(
    null,
  );
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);
  const userMutedRef = useRef(false);
  const detachVoiceRef = useRef<(() => void) | null>(null);

  const syncMicFromClient = useCallback(() => {
    const active = clientRef.current;
    if (!active) {
      return;
    }
    try {
      const state = active.getInputAudioState();
      setMicMuted(state.isMuted);
      userMutedRef.current = state.isMuted;
      if (state.permissionState === "granted") {
        setMicPermission("granted");
      } else if (state.permissionState === "denied") {
        setMicPermission("denied");
      } else if (state.permissionState === "pending") {
        setMicPermission("pending");
      }
    } catch {
      // ignore
    }
  }, []);

  const ensureMicActive = useCallback(() => {
    const active = clientRef.current;
    if (!active || userMutedRef.current) {
      return;
    }
    try {
      const state = active.getInputAudioState();
      if (state.isMuted) {
        active.unmuteInputAudio();
      }
      setMicMuted(false);
    } catch {
      // ignore
    }
  }, []);

  const toggleMic = useCallback(() => {
    const active = clientRef.current;
    if (!active) {
      return;
    }
    try {
      if (micMuted) {
        active.unmuteInputAudio();
        userMutedRef.current = false;
        setMicMuted(false);
      } else {
        active.muteInputAudio();
        userMutedRef.current = true;
        setMicMuted(true);
      }
    } catch {
      // ignore
    }
  }, [micMuted]);

  const stopDemo = useCallback(async () => {
    stoppingRef.current = true;
    startedAtRef.current = null;
    detachVoiceRef.current?.();
    detachVoiceRef.current = null;
    releaseAnamInputAudioStream(streamRef.current);
    streamRef.current = null;
    const client = clientRef.current;
    clientRef.current = null;
    if (client) {
      await client.stopStreaming().catch(() => undefined);
    }
    setLandingDemoProxyToken(null);
    setPipelineState("idle");
    setMicPermission("unknown");
    setMicMuted(false);
    userMutedRef.current = false;
    setStatus((current) => (current === "error" ? current : "ended"));
  }, []);

  const startDemo = useCallback(async () => {
    stoppingRef.current = false;
    userMutedRef.current = false;
    setError(null);
    setElapsedSec(0);
    setMicMuted(false);
    setMicPermission("pending");
    setPipelineState("idle");
    setStatus("connecting");

    try {
      // Mic + video unlock first — must stay in the Start tap gesture on iOS.
      // @see https://anam.ai/docs/resources/faq
      const inputAudioStream = await acquireAnamInputAudioStream();
      if (stoppingRef.current) {
        releaseAnamInputAudioStream(inputAudioStream);
        return;
      }
      streamRef.current = inputAudioStream;
      setMicPermission("granted");
      // Do not await — empty video.play() can hang the Start gesture.
      unlockAnamVideoPlayback(VIDEO_ID);

      const response = await fetch(DEMO_ENDPOINT, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as DemoPayload & {
        error?: string;
      };

      if (!response.ok || !payload.sessionToken) {
        throw new Error(payload.error ?? "Failed to start Talk demo");
      }

      setLandingDemoProxyToken(payload.demoProxyToken ?? null);

      const maxSec =
        typeof payload.maxDurationSec === "number" && payload.maxDurationSec > 0
          ? payload.maxDurationSec
          : DEFAULT_MAX_SEC;
      setMaxDurationSec(maxSec);

      if (payload.employeeName) {
        setLiveName(payload.employeeName);
      }
      if (payload.avatarPreviewUrl) {
        setLivePreview(payload.avatarPreviewUrl);
      }
      setLiveRole(payload.employeeRole ?? null);

      const employeeId = payload.employeeId ?? LANDING_DEMO_EMPLOYEE_ID;
      // Same path as dashboard: ElevenLabs when configured on the employee.
      const voiceMode: TalkVoiceMode =
        payload.voiceMode === "elevenlabs" ? "elevenlabs" : "anam";

      const anamClient = createAnamTalkClient(payload.sessionToken);
      clientRef.current = anamClient;

      anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        if (stoppingRef.current) {
          return;
        }
        startedAtRef.current = Date.now();
        setStatus("live");
        setMicPermission("granted");
        ensureMicActive();
        syncMicFromClient();
      });

      anamClient.addListener(AnamEvent.MIC_PERMISSION_GRANTED, () => {
        setMicPermission("granted");
        ensureMicActive();
        syncMicFromClient();
      });

      anamClient.addListener(AnamEvent.MIC_PERMISSION_DENIED, () => {
        setMicPermission("denied");
      });

      anamClient.addListener(AnamEvent.INPUT_AUDIO_STREAM_STARTED, () => {
        setMicPermission("granted");
        ensureMicActive();
        syncMicFromClient();
      });

      anamClient.addListener(AnamEvent.USER_SPEECH_STARTED, () => {
        setPipelineState("listening");
      });

      // Do not flip to "thinking" on USER_SPEECH_ENDED — STT + history can lag
      // several seconds before the brain starts. Thinking is set by the voice
      // pipeline when the turn actually begins.

      anamClient.addListener(
        AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
        (event: MessageStreamEvent) => {
          if (event.role === MessageRole.PERSONA && event.content.trim()) {
            setPipelineState("speaking");
          }
        },
      );

      anamClient.addListener(
        AnamEvent.CONNECTION_CLOSED,
        (reason: ConnectionClosedCode, details?: string) => {
          if (stoppingRef.current) {
            return;
          }
          setError(
            reason === ConnectionClosedCode.MICROPHONE_PERMISSION_DENIED
              ? "Microphone permission is required for Talk."
              : details?.trim() || "Talk connection closed.",
          );
          setStatus("error");
          void stopDemo();
        },
      );

      detachVoiceRef.current = attachTalkVoicePipeline({
        anamClient,
        employeeId,
        voiceMode,
        setPipelineState,
        brainEndpoint: DEMO_BRAIN_ENDPOINT,
        synthesizeEndpoint:
          voiceMode === "elevenlabs" ? DEMO_TTS_ENDPOINT : undefined,
      });

      if (stoppingRef.current) {
        releaseAnamInputAudioStream(streamRef.current);
        streamRef.current = null;
        return;
      }

      const video = document.getElementById(VIDEO_ID);
      if (video instanceof HTMLVideoElement) {
        video.muted = false;
        video.defaultMuted = false;
        video.playsInline = true;
      }

      await anamClient.streamToVideoElement(VIDEO_ID, inputAudioStream);
      if (video instanceof HTMLVideoElement) {
        video.muted = false;
        await safeVideoPlay(video);
      }
      ensureMicActive();
      syncMicFromClient();
    } catch (startError: unknown) {
      await stopDemo();
      setStatus("error");
      setMicPermission(
        startError instanceof DOMException &&
          startError.name === "NotAllowedError"
          ? "denied"
          : "unknown",
      );
      setError(
        startError instanceof Error
          ? startError.message
          : "Failed to start Talk demo",
      );
    }
  }, [ensureMicActive, stopDemo, syncMicFromClient]);

  useEffect(() => {
    if (!open) {
      void stopDemo();
      setStatus("idle");
      setIntro("title");
      setError(null);
      setElapsedSec(0);
      setPipelineState("idle");
      setLiveName(employeeName);
      setLivePreview(avatarPreviewUrl);
      setLiveRole(null);
      return;
    }

    setIntro("title");
    const timer = window.setTimeout(() => {
      setIntro("stage");
    }, TITLE_CARD_MS);

    return () => window.clearTimeout(timer);
  }, [avatarPreviewUrl, employeeName, open, stopDemo]);

  // Tab kill / navigate away must release Anam concurrency on lab-2.
  useEffect(() => {
    if (!open) {
      return;
    }

    const onPageHide = () => {
      void stopDemo();
    };

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      void stopDemo();
    };
  }, [open, stopDemo]);

  useEffect(() => {
    if (status !== "live" || startedAtRef.current === null) {
      return;
    }

    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) {
        return;
      }
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSec(elapsed);
      if (elapsed >= maxDurationSec) {
        void stopDemo();
        setError("Session ended — 1:00 complete.");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [maxDurationSec, status, stopDemo]);

  useEffect(() => {
    if (status !== "live") {
      return;
    }
    const interval = window.setInterval(syncMicFromClient, 800);
    return () => window.clearInterval(interval);
  }, [status, syncMicFromClient]);

  const handleOpenChange = (next: boolean) => {
    if (!next && (status === "connecting" || status === "live")) {
      void stopDemo();
    }
    onOpenChange(next);
  };

  const isLive = status === "live";
  const showTitleCard = open && intro === "title";
  const showStage = !showTitleCard;
  const canClose = status !== "connecting" && status !== "live";
  const micHearing = isLive && micPermission === "granted" && !micMuted;
  const micListening = pipelineState === "listening";
  const pipeline = pipelineCopy(pipelineState, liveName);
  const speaking = pipelineState === "speaking";
  const thinking = pipelineState === "thinking";
  const listening = pipelineState === "listening";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden border-0 bg-black p-0 text-white ring-0",
          "fixed inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col rounded-none",
          "md:inset-auto md:top-1/2 md:left-1/2 md:h-[min(820px,90dvh)] md:max-h-[90dvh] md:w-[min(980px,92vw)] md:max-w-[980px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-none md:border md:border-white/12 md:shadow-[0_48px_140px_rgba(0,0,0,0.75)]",
          "data-open:zoom-in-100 data-closed:zoom-out-100",
        )}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          if (!canClose) {
            event.preventDefault();
          }
        }}
      >
        {/* Cinema title card — black frame, name, 01:00 */}
        <div
          aria-hidden={!showTitleCard}
          className={cn(
            "absolute inset-0 z-40 flex flex-col bg-black transition-opacity duration-700 ease-out",
            showTitleCard
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          {canClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4 z-10 text-white/40 hover:bg-white/8 hover:text-white"
              aria-label="Close"
              onClick={() => handleOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          ) : null}
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="text-[10px] tracking-[0.42em] text-white/35 uppercase">
              NULLXES
            </p>
            <DialogTitle
              className={cn(
                "mt-8 max-w-[18ch] font-(family-name:--font-landing-serif) text-[2rem] leading-[1.05] tracking-[0.06em] text-white uppercase sm:text-4xl md:text-[2.75rem]",
                showTitleCard && "landing-cinema-title",
              )}
            >
              {liveName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Private session · one minute
            </DialogDescription>
          </div>
          <p className="pb-10 text-center font-mono text-sm tabular-nums tracking-[0.28em] text-white/55 sm:pb-12 sm:text-base">
            {formatDuration(maxDurationSec)}
          </p>
        </div>

        <header
          className={cn(
            "relative z-20 flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5 transition-opacity duration-500 sm:px-5 md:px-6",
            showStage ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate text-base font-medium tracking-[0.04em] text-white uppercase md:text-lg">
              {liveName}
            </p>
            <p className="truncate text-[11px] tracking-wide text-white/40 md:text-xs">
              {liveRole?.trim() || "Private session"}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <p
              className="font-mono text-[11px] tabular-nums tracking-wide text-white/70 md:text-xs"
              aria-label="Session time limit one minute"
            >
              {formatDuration(isLive ? elapsedSec : 0)}
              <span className="text-white/35"> / </span>
              {formatDuration(maxDurationSec)}
            </p>
            {canClose && showStage ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-white/55 hover:bg-white/8 hover:text-white"
                aria-label="Close"
                onClick={() => handleOpenChange(false)}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </header>

        <div className="relative min-h-0 flex-1 bg-black">
          <div className="absolute inset-0">
            <Image
              src={livePreview}
              alt={liveName}
              fill
              className={cn(
                "object-cover object-[50%_18%] transition-opacity duration-700 ease-out",
                showStage && !isLive ? "opacity-100" : "opacity-0",
              )}
              sizes="(max-width: 768px) 100vw, 980px"
              priority
            />
          </div>
          <video
            id={VIDEO_ID}
            autoPlay
            playsInline
            {...{ "webkit-playsinline": "true" }}
            className={cn(
              "absolute inset-0 size-full object-cover object-[50%_18%] transition-opacity duration-500",
              isLive ? "opacity-100" : "opacity-0",
            )}
          />

          {isLive ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-between p-4 md:flex">
              <p className="text-[10px] font-semibold tracking-[0.28em] text-white/35 uppercase">
                NULLXES
              </p>
              <div
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide uppercase backdrop-blur-sm transition-colors",
                  speaking && "border-white/25 bg-white/15 text-white",
                  listening && "border-white/30 bg-white/10 text-white",
                  thinking && "border-white/20 bg-black/55 text-white/80",
                  !speaking &&
                    !listening &&
                    !thinking &&
                    "border-white/12 bg-black/50 text-white/55",
                )}
              >
                {pipeline.label}
              </div>
            </div>
          ) : null}

          {isLive ? (
            <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 flex w-[min(92%,420px)] -translate-x-1/2 flex-col items-center gap-2 md:bottom-24">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-2.5 backdrop-blur-md transition-colors",
                  speaking && "border-white/25 bg-black/70",
                  listening && "border-white/30 bg-black/70",
                  thinking && "border-white/15 bg-black/70",
                  !speaking &&
                    !listening &&
                    !thinking &&
                    "border-white/10 bg-black/60",
                )}
              >
                {thinking ? (
                  <Loader2 className="size-4 animate-spin text-white/70" />
                ) : (
                  <PipelineBars active={speaking || listening} />
                )}
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium text-white">
                    {pipeline.label}
                  </p>
                  <p className="text-[11px] text-white/50">{pipeline.hint}</p>
                </div>
              </div>
            </div>
          ) : null}

          {isLive ? (
            <div className="pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2 md:hidden">
              <div
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium uppercase backdrop-blur-sm",
                  speaking && "border-white/25 bg-black/65 text-white",
                  listening && "border-white/30 bg-black/65 text-white",
                  thinking && "border-white/15 bg-black/65 text-white/80",
                  !speaking &&
                    !listening &&
                    !thinking &&
                    "border-white/10 bg-black/55 text-white/55",
                )}
              >
                {pipeline.label}
              </div>
            </div>
          ) : null}

          {status === "connecting" ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70">
              <div className="h-px w-16 animate-pulse bg-white/40" />
              <p className="text-[11px] tracking-[0.28em] text-white/45 uppercase">
                Opening
              </p>
            </div>
          ) : null}

          {isLive && micPermission === "denied" ? (
            <p className="absolute inset-x-0 bottom-28 z-20 flex justify-center px-4 text-center text-[11px] text-white/55">
              Microphone permission required.
            </p>
          ) : null}
        </div>

        <footer
          className={cn(
            "relative z-20 flex shrink-0 flex-col items-center gap-2 border-t border-white/8 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-500 sm:px-5 md:px-6 md:py-5",
            showStage ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {error ? (
            <p className="text-center text-sm text-white/70" role="alert">
              {error}
            </p>
          ) : null}

          {status === "idle" || status === "ended" || status === "error" ? (
            <Button
              type="button"
              disabled={!showStage}
              className="h-12 rounded-none border border-white/10 bg-white px-10 text-sm font-medium tracking-wide text-black shadow-none hover:bg-white/92 md:h-[52px]"
              onClick={() => void startDemo()}
            >
              TALK
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-none border border-white/12 bg-black/70 px-2 py-1.5 backdrop-blur-md">
              <button
                type="button"
                aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
                title={
                  micHearing
                    ? `${liveName} can hear you`
                    : `${liveName} cannot hear you`
                }
                disabled={!isLive}
                onClick={toggleMic}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-none border bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-40",
                  micHearing ? "border-white/45" : "border-white/20 opacity-70",
                )}
              >
                {micMuted ? (
                  <MicOff className="size-4 stroke-[1.75]" />
                ) : (
                  <Mic className="size-4 stroke-[1.75]" />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-black",
                    micHearing ? "bg-white" : "bg-white/35",
                    micHearing && micListening && "animate-pulse",
                  )}
                />
              </button>

              <Button
                type="button"
                className="h-11 rounded-none border border-white/10 bg-white px-8 text-sm font-medium text-black shadow-none hover:bg-white/92"
                onClick={() => void stopDemo()}
              >
                End session
              </Button>
            </div>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
