"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
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
    <div className="absolute inset-x-0 bottom-0 z-30 flex h-24 items-stretch gap-3 border-t border-white/10 bg-black/75 px-3 py-2 backdrop-blur-[2px]">
      <div className="relative aspect-video h-full overflow-hidden rounded-md border border-white/12 bg-[#111111]">
        {failed ? (
          <div className="flex size-full min-w-[120px] items-center justify-center px-2 text-center text-[10px] text-white/45">
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
      <div className="flex min-w-0 flex-col justify-center">
        <p className="truncate text-xs text-white/80">{userName}</p>
        <p className="text-[10px] text-white/45">{t("you")}</p>
      </div>
    </div>
  );
}
