"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnamEvent, ConnectionClosedCode } from "@anam-ai/js-sdk";
import { Loader2, Mic, X } from "lucide-react";
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
} from "@/features/runtime-session/lib/acquire-anam-input-audio-stream";
import { cn } from "@/lib/utils";

const VIDEO_ID = "nullxes-landing-anam-demo-video";
const DEMO_ENDPOINT = "/api/landing/adeline-demo/talk";
const DEFAULT_MAX_SEC = 60;

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

type DemoPayload = {
  sessionToken: string;
  maxDurationSec?: number;
  employeeName?: string;
  avatarPreviewUrl?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [maxDurationSec, setMaxDurationSec] = useState(DEFAULT_MAX_SEC);

  const clientRef = useRef<ReturnType<typeof createAnamTalkClient> | null>(
    null,
  );
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);

  const stopDemo = useCallback(async () => {
    stoppingRef.current = true;
    startedAtRef.current = null;
    releaseAnamInputAudioStream(streamRef.current);
    streamRef.current = null;
    const client = clientRef.current;
    clientRef.current = null;
    if (client) {
      await client.stopStreaming().catch(() => undefined);
    }
    setStatus((current) => (current === "error" ? current : "ended"));
  }, []);

  const startDemo = useCallback(async () => {
    stoppingRef.current = false;
    setError(null);
    setElapsedSec(0);
    setStatus("connecting");

    try {
      const response = await fetch(DEMO_ENDPOINT, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as DemoPayload & {
        error?: string;
      };

      if (!response.ok || !payload.sessionToken) {
        throw new Error(payload.error ?? "Failed to start Talk demo");
      }

      const maxSec =
        typeof payload.maxDurationSec === "number" && payload.maxDurationSec > 0
          ? payload.maxDurationSec
          : DEFAULT_MAX_SEC;
      setMaxDurationSec(maxSec);

      const anamClient = createAnamTalkClient(payload.sessionToken);
      clientRef.current = anamClient;

      anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        if (stoppingRef.current) {
          return;
        }
        startedAtRef.current = Date.now();
        setStatus("live");
      });

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

      const inputAudioStream = await acquireAnamInputAudioStream();
      if (stoppingRef.current) {
        releaseAnamInputAudioStream(inputAudioStream);
        return;
      }
      streamRef.current = inputAudioStream;

      await anamClient.streamToVideoElement(VIDEO_ID, inputAudioStream);
    } catch (startError: unknown) {
      await stopDemo();
      setStatus("error");
      setError(
        startError instanceof Error
          ? startError.message
          : "Failed to start Talk demo",
      );
    }
  }, [stopDemo]);

  useEffect(() => {
    if (!open) {
      void stopDemo();
      setStatus("idle");
      setError(null);
      setElapsedSec(0);
    }
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
        setError("Trial ended — 1 minute complete.");
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [maxDurationSec, status, stopDemo]);

  const handleOpenChange = (next: boolean) => {
    if (!next && (status === "connecting" || status === "live")) {
      void stopDemo();
    }
    onOpenChange(next);
  };

  const isLive = status === "live";
  const canClose = status !== "connecting" && status !== "live";

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
        onEscapeKeyDown={(event) => {
          if (!canClose) {
            event.preventDefault();
          }
        }}
      >
        <header className="relative flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-8">
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-lg font-medium tracking-tight text-white sm:text-xl">
              {employeeName}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/45">
              Avatar Talk · 1 minute public demo
            </DialogDescription>
            {isLive ? (
              <p className="font-mono text-sm tabular-nums text-white/55">
                {formatDuration(elapsedSec)} / {formatDuration(maxDurationSec)}
              </p>
            ) : null}
          </div>
          {canClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-white/55 hover:bg-white/8 hover:text-white"
              aria-label="Close"
              onClick={() => handleOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </header>

        <div className="relative min-h-0 flex-1 bg-black">
          <div className="absolute inset-0">
            <Image
              src={avatarPreviewUrl}
              alt={employeeName}
              fill
              className={cn(
                "object-cover object-[center_18%] transition-opacity duration-500",
                isLive ? "opacity-0" : "opacity-100",
              )}
              sizes="100vw"
              priority
            />
          </div>
          <video
            id={VIDEO_ID}
            autoPlay
            playsInline
            className={cn(
              "absolute inset-0 size-full object-cover object-[center_18%] transition-opacity duration-500",
              isLive ? "opacity-100" : "opacity-0",
            )}
          />

          {status === "connecting" ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55">
              <Loader2 className="size-6 animate-spin text-white/70" />
              <p className="text-xs text-white/55">Connecting avatar…</p>
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col items-center gap-3 border-t border-white/8 px-5 py-5 sm:px-8">
          {error ? (
            <p className="text-center text-sm text-red-300/90" role="alert">
              {error}
            </p>
          ) : null}

          {status === "idle" || status === "ended" || status === "error" ? (
            <Button
              type="button"
              className="h-[52px] rounded-full border border-white/10 bg-white px-10 text-sm font-medium text-black shadow-none hover:bg-white/92"
              onClick={() => void startDemo()}
            >
              <Mic className="mr-2.5 size-4" />
              Start Talk demo
            </Button>
          ) : (
            <Button
              type="button"
              className="h-[52px] rounded-full border border-white/10 bg-white px-10 text-sm font-medium text-black shadow-none hover:bg-white/92"
              onClick={() => void stopDemo()}
            >
              End demo
            </Button>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
