import type { AnamClientOptions } from "@anam-ai/js-sdk";

const DEFAULT_END_OF_SPEECH_SENSITIVITY = 0.32;

function resolveEndOfSpeechSensitivity(): number {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_ANAM_END_OF_SPEECH_SENSITIVITY?.trim()
      : undefined;

  const parsed = raw ? Number(raw) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_END_OF_SPEECH_SENSITIVITY;
  }

  return Math.min(1, Math.max(0, parsed));
}

/** Shared Anam browser client options for NULLXES Talk sessions. */
export function buildAnamTalkClientOptions(): AnamClientOptions {
  return {
    metrics: {
      disableClientMetrics: true,
    },
    // Lower sensitivity keeps the mic open longer between words (helps close-mic speech).
    // @see https://anam.ai/docs/javascript-sdk/reference/basic-usage
    voiceDetection: {
      endOfSpeechSensitivity: resolveEndOfSpeechSensitivity(),
    },
  };
}
