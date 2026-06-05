import type { BetterAuthOptions } from "better-auth";

export type OAuthProviderId = "google" | "github";

function hasCredentials(clientId?: string, clientSecret?: string): boolean {
  return Boolean(clientId?.trim() && clientSecret?.trim());
}

export function getEnabledOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];

  if (
    hasCredentials(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
  ) {
    providers.push("google");
  }

  if (
    hasCredentials(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET)
  ) {
    providers.push("github");
  }

  return providers;
}

export function buildOAuthSocialProviders(): BetterAuthOptions["socialProviders"] {
  const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

  if (
    hasCredentials(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
  ) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      prompt: "select_account",
    };
  }

  if (
    hasCredentials(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET)
  ) {
    socialProviders.github = {
      clientId: process.env.GITHUB_CLIENT_ID!.trim(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET!.trim(),
    };
  }

  return Object.keys(socialProviders).length > 0 ? socialProviders : undefined;
}
