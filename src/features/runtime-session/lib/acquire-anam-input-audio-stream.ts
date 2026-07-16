import { isMobileTalkClient } from "./is-mobile-talk-client";

/**
 * Single browser mic capture for the whole Talk session.
 * Passed into Anam `streamToVideoElement(id, stream)` so the SDK does not
 * call getUserMedia again (avoids duplicate tracks / permission races).
 *
 * Call this inside a user gesture on mobile (tap Start) — iOS Safari requires
 * getUserMedia + audio unlock in the same gesture chain.
 *
 * @see https://anam.ai/docs/javascript-sdk/reference/audio-control
 * @see https://anam.ai/docs/resources/faq (Safari/iOS autoplay + mic)
 */
export async function acquireAnamInputAudioStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture is not available in this browser.");
  }

  const mobile = isMobileTalkClient();

  // Mobile/WebKit: keep constraints minimal — ideal sampleRate/channelCount
  // often rejects or returns a silent track on iOS Safari.
  const audio: boolean | MediaTrackConstraints = mobile
    ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    : {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: { ideal: 48_000 },
      };

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio,
      video: false,
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
  }
}

export function releaseAnamInputAudioStream(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/** play() on an empty <video> can hang forever in some Chromium/WebKit builds. */
export async function safeVideoPlay(
  video: HTMLVideoElement,
  timeoutMs = 400,
): Promise<void> {
  await Promise.race([
    video.play().then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]).catch(() => undefined);
}

/**
 * Unlock persona video audio on iOS/WebKit within a user gesture.
 * Must run in the Start tap — do not block session start on play().
 * @see https://anam.ai/docs/javascript-sdk/reference/basic-usage (`playsinline`)
 */
export function unlockAnamVideoPlayback(videoElementId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const video = document.getElementById(videoElementId);
  if (!(video instanceof HTMLVideoElement)) {
    return;
  }

  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.playsInline = true;
  video.muted = false;
  video.defaultMuted = false;

  // Fire-and-forget: awaiting play() here previously froze Talk on "Starting…"
  // when the element had no media yet.
  void safeVideoPlay(video).then(() => {
    try {
      video.pause();
    } catch {
      // ignore
    }
  });
}
