"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

function resolveAuthClientBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configured = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseUrl(),
  plugins: [twoFactorClient({ twoFactorPage: "/login/verify-2fa" })],
});
