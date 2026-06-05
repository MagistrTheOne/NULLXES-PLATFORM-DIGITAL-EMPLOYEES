import { getPublicAppUrl } from "@/shared/config/env";

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getPolarAccessToken(): string | undefined {
  return readOptionalEnv("POLAR_ACCESS_TOKEN");
}

export function getPolarWebhookSecret(): string | undefined {
  return readOptionalEnv("POLAR_WEBHOOK_SECRET");
}

export function getPolarServer(): "sandbox" | "production" {
  return process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";
}

export function getPolarSuccessUrl(): string {
  return (
    readOptionalEnv("POLAR_SUCCESS_URL") ??
    `${getPublicAppUrl()}/settings?tab=billing&checkout=success`
  );
}

export function getPolarReturnUrl(): string {
  return (
    readOptionalEnv("POLAR_RETURN_URL") ?? `${getPublicAppUrl()}/settings`
  );
}

export function getPolarWebhookUrl(): string {
  return `${getPublicAppUrl()}/api/webhook/polar`;
}

export function isPolarConfigured(): boolean {
  return Boolean(getPolarAccessToken());
}
