import { createHash } from "node:crypto";

function readOptionalEnv(name: string): string | undefined {
  const value = sanitizeEnvValue(process.env[name]);
  return value && value.length > 0 ? value : undefined;
}

/** Strip wrapping quotes Vercel users often paste from `.env` files. */
export function sanitizeEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function normalizeHttpsUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return stripTrailingSlash(trimmed);
  }

  return stripTrailingSlash(`https://${trimmed}`);
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function isDevelopmentRuntime(): boolean {
  return process.env.NODE_ENV === "development";
}

/** True during `next build` (production build phase). */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/** Vercel injects these at build and runtime — used when local URLs are copied to prod env. */
export function getVercelDeploymentUrl(): string | undefined {
  const production = readOptionalEnv("VERCEL_PROJECT_PRODUCTION_URL");
  if (production) {
    return normalizeHttpsUrl(production);
  }

  const deployment = readOptionalEnv("VERCEL_URL");
  if (deployment) {
    return normalizeHttpsUrl(deployment);
  }

  return undefined;
}

/** Canonical app origin for auth, webhooks, and invite links. */
export function resolveAppBaseUrl(): string {
  const configured =
    readOptionalEnv("BETTER_AUTH_URL") ??
    readOptionalEnv("NEXT_PUBLIC_BETTER_AUTH_URL");

  if (configured) {
    const normalized = stripTrailingSlash(configured);
    if (!(process.env.NODE_ENV === "production" && isLocalhostUrl(normalized))) {
      return normalized;
    }
  }

  const vercelUrl = getVercelDeploymentUrl();
  if (vercelUrl) {
    return vercelUrl;
  }

  if (isDevelopmentRuntime() || isBuildPhase()) {
    // During local dev or `npm run build` (where no BETTER_AUTH_URL may be set),
    // use localhost as a safe default. At runtime on Vercel the injected
    // VERCEL_* vars or the real BETTER_AUTH_URL will take precedence.
    return "http://localhost:3000";
  }

  throw new Error(
    "App base URL is not configured. Set BETTER_AUTH_URL or deploy on Vercel.",
  );
}

export function getDatabaseUrl(): string {
  const url = sanitizeEnvValue(process.env.DATABASE_URL);
  if (url) {
    return url;
  }

  if (isDevelopmentRuntime() || isBuildPhase()) {
    // Safe dummy for local dev and `npm run build`.
    // Real connection is never made from the dummy during build.
    return "postgresql://dummy:dummy@localhost:5432/dummy";
  }

  throw new Error("DATABASE_URL is not set");
}

export function getBetterAuthSecret(): string {
  const secret = sanitizeEnvValue(process.env.BETTER_AUTH_SECRET);
  if (secret) {
    return secret;
  }

  if (isDevelopmentRuntime() || isBuildPhase()) {
    // 32+ char placeholder is enough for local/build.
    // Production deployments must provide a strong real secret.
    return "build-time-insecure-secret-for-local-build-only-32chars";
  }

  throw new Error("BETTER_AUTH_SECRET is not set");
}

export function getBetterAuthUrl(): string {
  return resolveAppBaseUrl();
}

/** Client-side auth base URL — set NEXT_PUBLIC_BETTER_AUTH_URL in .env (e.g. http://localhost:3000) */
export function getPublicBetterAuthUrl(): string {
  const publicUrl = readOptionalEnv("NEXT_PUBLIC_BETTER_AUTH_URL");
  if (publicUrl) {
    const normalized = stripTrailingSlash(publicUrl);
    if (!(process.env.NODE_ENV === "production" && isLocalhostUrl(normalized))) {
      return normalized;
    }
  }

  return resolveAppBaseUrl();
}

/** OpenAI — https://developers.openai.com/api/docs/ */
export function getOpenAiApiKey(): string | undefined {
  return readOptionalEnv("OPENAI_API_KEY");
}

/** Anam personas — https://anam.ai/docs/personas/overview */
export function getAnamApiKey(): string | undefined {
  return readOptionalEnv("ANAM_API_KEY");
}

/** ElevenLabs agents — https://elevenlabs.io/docs/eleven-agents/overview */
export function getElevenLabsApiKey(): string | undefined {
  return readOptionalEnv("ELEVENLABS_API_KEY");
}

export function getStreamApiKey(): string | undefined {
  return readOptionalEnv("STREAM_API_KEY");
}

export function getStreamSecretKey(): string | undefined {
  return readOptionalEnv("STREAM_SECRET_KEY");
}

/** Public Stream API key for the Video React SDK (safe to expose in the browser). */
export function getPublicStreamApiKey(): string | undefined {
  return readOptionalEnv("NEXT_PUBLIC_STREAM_API_KEY");
}

/** Inngest — https://www.inngest.com/docs/platform/signing-keys */
export function getInngestSigningKey(): string | undefined {
  return readOptionalEnv("INNGEST_SIGNING_KEY");
}

/** Inngest event publishing — https://www.inngest.com/docs/events/creating-an-event-key */
export function getInngestEventKey(): string | undefined {
  return readOptionalEnv("INNGEST_EVENT_KEY");
}

export function isInngestDevMode(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return readOptionalEnv("INNGEST_DEV") === "1";
}

export function getNgrokUrl(): string | undefined {
  if (!isDevelopmentRuntime()) {
    return undefined;
  }

  return readOptionalEnv("NGROK_URL");
}

/** Public HTTPS base URL — ngrok in local dev, deployment URL in production. */
export function getPublicAppUrl(): string {
  const ngrokUrl = getNgrokUrl();
  if (ngrokUrl) {
    return stripTrailingSlash(ngrokUrl);
  }

  return resolveAppBaseUrl();
}

export function getInngestServeUrl(): string {
  return `${resolveAppBaseUrl()}/api/inngest`;
}

/** AES-256 key (32 bytes, base64) for field-level encryption. */
export function getDataEncryptionKey(): string {
  const configured = readOptionalEnv("DATA_ENCRYPTION_KEY");
  if (configured) {
    return configured;
  }

  if (isDevelopmentRuntime() || isBuildPhase()) {
    // Derive a deterministic key from the (possibly dummy) secret for build/dev.
    // Real prod must set a strong DATA_ENCRYPTION_KEY (32 bytes base64).
    return createHash("sha256")
      .update(getBetterAuthSecret())
      .digest("base64");
  }

  throw new Error("DATA_ENCRYPTION_KEY is not set");
}

export type DataEncryptionKeyRing = {
  /** Version used for new encryptions (highest configured). */
  activeVersion: number;
  /** base64-encoded 32-byte keys by version. */
  keys: Map<number, string>;
};

/**
 * Versioned key ring for field-level encryption key rotation.
 *
 * `DATA_ENCRYPTION_KEYS` holds newer keys as comma/newline-separated
 * `v<N>:<base64>` entries, e.g. `v2:AAAA...,v3:BBBB...`. The legacy
 * `DATA_ENCRYPTION_KEY` is always registered as v1 so existing `enc:v1:`
 * ciphertexts keep decrypting. The highest version encrypts new values.
 */
export function getDataEncryptionKeyRing(): DataEncryptionKeyRing {
  const keys = new Map<number, string>([[1, getDataEncryptionKey()]]);

  const configured = readOptionalEnv("DATA_ENCRYPTION_KEYS");
  if (configured) {
    for (const entry of configured.split(/[\n,]/)) {
      const match = entry.trim().match(/^v(\d+):(.+)$/);
      if (!match) {
        continue;
      }

      const version = Number.parseInt(match[1], 10);
      const key = match[2].trim();
      if (version >= 1 && key.length > 0) {
        keys.set(version, key);
      }
    }
  }

  return { activeVersion: Math.max(...keys.keys()), keys };
}
