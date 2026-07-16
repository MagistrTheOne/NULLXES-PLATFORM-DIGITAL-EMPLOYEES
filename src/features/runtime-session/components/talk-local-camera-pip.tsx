"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { isMobileTalkClient } from "../lib/is-mobile-talk-client";

export function TalkLocalCameraPip({
  enabled,
  userName,
}: {
  enabled: boolean;
  userName: string;
}) {
  const t = useTranslations("employees.talk.stage");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setFailed(false);
      const stream = streamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      return;
    }

    let active = true;

    async function startCamera(): Promise<void> {
      setFailed(false);

      try {
        const mobile = isMobileTalkClient();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: mobile
            ? {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 360 },
              }
            : {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              },
          audio: false,
        });

        if (!active) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    }

    void startCamera();

    return () => {
      active = false;
      const stream = streamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute z-30 overflow-hidden border border-white/12 bg-black/80 backdrop-blur-[2px]",
        // Sit above the call dock + safe-area on phones; desktop strip at bottom.
        "right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] w-24 rounded-lg sm:w-28",
        "lg:inset-x-0 lg:bottom-0 lg:flex lg:h-24 lg:w-auto lg:items-stretch lg:gap-3 lg:rounded-none lg:border-x-0 lg:border-t lg:border-b-0 lg:px-3 lg:py-2",
      )}
    >
      <div className="relative aspect-video w-full bg-[#111111] lg:aspect-auto lg:h-full lg:w-auto lg:overflow-hidden lg:rounded-md">
        {failed ? (
          <div className="flex size-full min-h-16 items-center justify-center px-2 text-center text-[10px] text-white/45 lg:min-w-[120px]">
            {t("cameraUnavailable")}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="hidden min-w-0 flex-col justify-center lg:flex">
        <p className="truncate text-xs text-white/80">{userName}</p>
        <p className="text-[10px] text-white/45">{t("you")}</p>
      </div>
    </div>
  );
}
