import type { AnamClientOptions } from "@anam-ai/js-sdk";

// 0.5 balances turn-taking speed against cutting the user off mid-sentence.
// Lower values (e.g. 0.3) keep the mic open longer but add noticeable delay
// before the persona starts answering. Override per deployment via
// NEXT_PUBLIC_ANAM_END_OF_SPEECH_SENSITIVITY.
const DEFAULT_END_OF_SPEECH_SENSITIVITY = 0.5;

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
