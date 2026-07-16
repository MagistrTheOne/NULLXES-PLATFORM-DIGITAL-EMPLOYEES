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

/** Safe default for cara-3 / sara-3 stock avatars. */
export const ANAM_CARA3_VIDEO_DIMENSIONS = {
  videoWidth: 720,
  videoHeight: 480,
} as const;

/** cara-4 landscape (Talk stage is landscape-first). */
export const ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS = {
  videoWidth: 1152,
  videoHeight: 768,
} as const;

function resolveVideoQuality(): AnamTalkVideoQuality {
  const qualityRaw = readEnv("ANAM_TALK_VIDEO_QUALITY");
  return qualityRaw === "high" || qualityRaw === "auto" ? qualityRaw : "auto";
}

/**
 * Map Anam avatar model (`activeVersion`) → Talk session video size.
 * cara-4 rejects 720×480; cara-3 rejects 1152×768.
 */
export function resolveAnamTalkVideoOptionsForModel(
  model: string | null | undefined,
): AnamTalkSessionVideoOptions {
  const videoQuality = resolveVideoQuality();
  const normalized = (model ?? "").trim().toLowerCase();

  if (normalized.includes("cara-4") || normalized.includes("cara4")) {
    return {
      videoQuality,
      ...ANAM_CARA4_LANDSCAPE_VIDEO_DIMENSIONS,
    };
  }

  return {
    videoQuality,
    ...ANAM_CARA3_VIDEO_DIMENSIONS,
  };
}

/**
 * Default Talk video options when avatar model is unknown.
 * Prefer cara-3 size; mint path upgrades via avatar `activeVersion` or Anam
 * `supportedDimensions` retry / client remint hint.
 * @see https://anam.ai/docs/sessions/video-options
 */
export function buildAnamTalkSessionVideoOptions(): AnamTalkSessionVideoOptions {
  const widthRaw = readEnv("ANAM_TALK_VIDEO_WIDTH");
  const heightRaw = readEnv("ANAM_TALK_VIDEO_HEIGHT");
  const width = widthRaw ? Number(widthRaw) : Number.NaN;
  const height = heightRaw ? Number(heightRaw) : Number.NaN;

  const options: AnamTalkSessionVideoOptions = {
    videoQuality: resolveVideoQuality(),
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

/** Prefer landscape among Anam `supportedDimensions` (Talk stage is 16:9-ish). */
export function pickPreferredAnamVideoDimension(
  tokens: string[],
): { videoWidth: number; videoHeight: number } | null {
  const parsed = tokens
    .map((token) => parseAnamSupportedVideoDimension(token))
    .filter(
      (value): value is { videoWidth: number; videoHeight: number } =>
        value !== null,
    );

  if (parsed.length === 0) {
    return null;
  }

  const landscape = parsed.find((d) => d.videoWidth >= d.videoHeight);
  return landscape ?? parsed[0] ?? null;
}
