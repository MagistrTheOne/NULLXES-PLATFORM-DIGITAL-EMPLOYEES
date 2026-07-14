export type AnamVoiceDetectionOptions = {
  endOfSpeechSensitivity: number;
  silenceBeforeSkipTurnSeconds: number;
  silenceBeforeSessionEndSeconds: number;
  silenceBeforeAutoEndTurnSeconds: number;
  speechEnhancementLevel: number;
};

export type AnamTalkVideoQuality = "auto" | "high";

export type AnamTalkSessionVideoOptions = {
  videoWidth?: number;
  videoHeight?: number;
  videoQuality?: AnamTalkVideoQuality;
};

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined") {
    return undefined;
  }

  const value = process.env[name]?.trim();
  return value || undefined;
}

function resolveBoundedFloat(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = raw ? Number(raw) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function resolveBoundedInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = raw ? Number(raw) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

/** Shared end-of-speech sensitivity for browser client + persona config. */
export function resolveAnamEndOfSpeechSensitivity(): number {
  return resolveBoundedFloat(
    readEnv("ANAM_END_OF_SPEECH_SENSITIVITY") ??
      readEnv("NEXT_PUBLIC_ANAM_END_OF_SPEECH_SENSITIVITY"),
    0.5,
    0,
    1,
  );
}

/**
 * Persona-level voice detection for Anam session tokens and persisted personas.
 * @see https://anam.ai/docs/personas/voice-detection
 */
export function buildAnamVoiceDetectionOptions(): AnamVoiceDetectionOptions {
  return {
    endOfSpeechSensitivity: resolveAnamEndOfSpeechSensitivity(),
    silenceBeforeSkipTurnSeconds: resolveBoundedInt(
      readEnv("ANAM_SILENCE_BEFORE_SKIP_TURN_SECONDS"),
      15,
      0,
      900,
    ),
    silenceBeforeSessionEndSeconds: resolveBoundedInt(
      readEnv("ANAM_SILENCE_BEFORE_SESSION_END_SECONDS"),
      60,
      0,
      7200,
    ),
    silenceBeforeAutoEndTurnSeconds: resolveBoundedFloat(
      readEnv("ANAM_SILENCE_BEFORE_AUTO_END_TURN_SECONDS"),
      3,
      0.5,
      10,
    ),
    speechEnhancementLevel: resolveBoundedFloat(
      readEnv("ANAM_SPEECH_ENHANCEMENT_LEVEL"),
      0.8,
      0,
      1,
    ),
  };
}

/** Safe default for cara-3 (and common Anam stock avatars). */
export const ANAM_CARA3_VIDEO_DIMENSIONS = {
  videoWidth: 720,
  videoHeight: 480,
} as const;

/**
 * Session video output for Talk.
 * Default 720×480 — stock avatars (sara-3 / cara-3) reject 1152×768.
 * Override with ANAM_TALK_VIDEO_WIDTH + ANAM_TALK_VIDEO_HEIGHT together.
 * @see https://anam.ai/docs/sessions/video-options
 */
export function buildAnamTalkSessionVideoOptions(): AnamTalkSessionVideoOptions {
  const widthRaw = readEnv("ANAM_TALK_VIDEO_WIDTH");
  const heightRaw = readEnv("ANAM_TALK_VIDEO_HEIGHT");
  const width = widthRaw ? Number(widthRaw) : Number.NaN;
  const height = heightRaw ? Number(heightRaw) : Number.NaN;

  const qualityRaw = readEnv("ANAM_TALK_VIDEO_QUALITY");
  const videoQuality: AnamTalkVideoQuality | undefined =
    qualityRaw === "high" || qualityRaw === "auto" ? qualityRaw : "auto";

  // Always pin a supported size. Omitting dims lets Anam/SDK pick 1152×768,
  // which fails on sara-3 ("Supported dimensions: 720x480").
  const options: AnamTalkSessionVideoOptions = {
    videoQuality,
    ...ANAM_CARA3_VIDEO_DIMENSIONS,
  };

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    options.videoWidth = Math.floor(width);
    options.videoHeight = Math.floor(height);
  }

  return options;
}

/** Parse `720x480` style tokens from Anam error payloads. */
export function parseAnamSupportedVideoDimension(
  token: string,
): { videoWidth: number; videoHeight: number } | null {
  const match = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(token.trim());
  if (!match) {
    return null;
  }

  const videoWidth = Number(match[1]);
  const videoHeight = Number(match[2]);
  if (!Number.isFinite(videoWidth) || !Number.isFinite(videoHeight)) {
    return null;
  }

  return { videoWidth, videoHeight };
}
