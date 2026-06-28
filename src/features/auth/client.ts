"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

const emailOtpStepUpEnabled =
  process.env.NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED?.trim() === "true";

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function resolveAuthClientBaseUrl(): string {
  if (typeof window !== "undefined") {
    const pageOrigin = window.location.origin;
    const configured = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();

    if (configured) {
      const normalized = configured.replace(/\/$/, "");
      if (!isLocalhostUrl(normalized) || isLocalhostUrl(pageOrigin)) {
        return normalized;
      }
    }

    return pageOrigin;
  }

  const configured = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseUrl(),
  plugins: [
    twoFactorClient({ twoFactorPage: "/login/verify-2fa" }),
    // emailOTPClient — enable with NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED=true
    ...(emailOtpStepUpEnabled ? [emailOTPClient()] : []),
  ],
});
