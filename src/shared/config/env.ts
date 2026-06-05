export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function getBetterAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }
  return secret;
}

export function getBetterAuthUrl(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) {
    throw new Error("BETTER_AUTH_URL is not set");
  }
  return url;
}

/** Client-side auth base URL — set NEXT_PUBLIC_BETTER_AUTH_URL in .env (e.g. http://localhost:3000) */
export function getPublicBetterAuthUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (publicUrl) {
    return publicUrl;
  }

  const serverUrl = process.env.BETTER_AUTH_URL?.trim();
  if (serverUrl) {
    return serverUrl;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  throw new Error("NEXT_PUBLIC_BETTER_AUTH_URL or BETTER_AUTH_URL is not set");
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
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
  return (
    readOptionalEnv("NEXT_PUBLIC_STREAM_API_KEY") ??
    readOptionalEnv("STREAM_API_KEY")
  );
}

/** Inngest — https://www.inngest.com/docs/platform/signing-keys */
export function getInngestSigningKey(): string | undefined {
  return readOptionalEnv("INNGEST_SIGNING_KEY");
}

/** Inngest event publishing — https://www.inngest.com/docs/events/creating-an-event-key */
export function getInngestEventKey(): string | undefined {
  return readOptionalEnv("INNGEST_EVENT_KEY");
}

export function getInngestServeUrl(): string {
  return `${getBetterAuthUrl().replace(/\/$/, "")}/api/inngest`;
}
