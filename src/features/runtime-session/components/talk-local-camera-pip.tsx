"use client";

import { useEffect, useRef, useState } from "react";

export function TalkLocalCameraPip({
  enabled,
  userName,
}: {
  enabled: boolean;
  userName: string;
}) {
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
            width: { ideal: 640 },
            height: { ideal: 360 },
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
      } catch (error: unknown) {
        console.error("Local camera preview failed", error);
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
    <div className="absolute right-3 bottom-3 z-30 w-36 overflow-hidden rounded-lg border border-white/15 bg-black/90 shadow-md">
      <div className="relative aspect-video bg-[#111111]">
        {failed ? (
          <div className="flex size-full items-center justify-center px-2 text-center text-[10px] text-white/45">
            Camera unavailable
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
      <p className="truncate px-2 py-1 text-[10px] text-white/55">
        {userName} · You
      </p>
    </div>
  );
}
