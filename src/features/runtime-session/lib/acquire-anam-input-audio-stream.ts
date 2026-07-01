/**
 * Pre-acquire microphone for Anam Talk using SDK-recommended custom input stream.
 * @see https://anam.ai/docs/javascript-sdk/reference/audio-control
 */
export async function acquireAnamInputAudioStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone capture is not available in this browser.");
  }

  const audio: MediaTrackConstraints = {
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
