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

/** cara-4 landscape — rejected by cara-3 / sara-3 stock models. */
export const ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS = {
  videoWidth: 1152,
  videoHeight: 768,
} as const;

function isCara4LandscapeDims(width: number, height: number): boolean {
  return (
    width === ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS.videoWidth &&
    height === ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS.videoHeight
  );
}

/**
 * Session video output for Talk.
 * Always pin 720×480 for stock avatars. Omitting dims lets Anam pick 1152×768,
 * which fails on cara-3 at stream start.
 *
 * Custom env dims require ANAM_TALK_ALLOW_CUSTOM_VIDEO_DIMS=1 — otherwise
 * 1152×768 (and any other override) is ignored so Vercel misconfig cannot
 * break Talk.
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

  const options: AnamTalkSessionVideoOptions = {
    videoQuality,
    ...ANAM_CARA3_VIDEO_DIMENSIONS,
  };

  const allowCustom =
    readEnv("ANAM_TALK_ALLOW_CUSTOM_VIDEO_DIMS") === "1" ||
    readEnv("ANAM_TALK_ALLOW_CUSTOM_VIDEO_DIMS")?.toLowerCase() === "true";

  if (
    allowCustom &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  ) {
    options.videoWidth = Math.floor(width);
    options.videoHeight = Math.floor(height);
  } else if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    isCara4LandscapeDims(Math.floor(width), Math.floor(height))
  ) {
    // Explicitly keep cara-3 safe size when prod still has the old example envs.
    options.videoWidth = ANAM_CARA3_VIDEO_DIMENSIONS.videoWidth;
    options.videoHeight = ANAM_CARA3_VIDEO_DIMENSIONS.videoHeight;
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
