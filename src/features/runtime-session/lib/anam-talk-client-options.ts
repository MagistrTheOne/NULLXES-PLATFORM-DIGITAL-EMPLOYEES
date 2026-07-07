import type { AnamClientOptions } from "@anam-ai/js-sdk";
import { resolveAnamEndOfSpeechSensitivity } from "./anam-session-tuning";

/** Shared Anam browser client options for NULLXES Talk sessions. */
export function buildAnamTalkClientOptions(): AnamClientOptions {
  return {
    metrics: {
      disableClientMetrics: true,
    },
    // @see https://anam.ai/docs/personas/voice-detection
    voiceDetection: {
      endOfSpeechSensitivity: resolveAnamEndOfSpeechSensitivity(),
    },
  };
}
