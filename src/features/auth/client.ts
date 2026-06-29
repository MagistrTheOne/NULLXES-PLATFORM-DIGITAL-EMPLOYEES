"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

const emailOtpStepUpEnabled =
  process.env.NEXT_PUBLIC_EMAIL_OTP_STEP_UP_ENABLED?.trim() === "true";

function resolveAuthClientBaseUrl(): string {
  // In the browser, always talk to auth on the SAME origin the app was loaded
  // from. This prevents cross-origin/CORS failures when the deployment serves a
  // custom domain (e.g. https://www.nullxesdai.online) but the build baked a
  // different NEXT_PUBLIC_BETTER_AUTH_URL (e.g. an *.vercel.app URL). Cookies and
  // CSRF/origin checks line up because requests stay first-party.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side (SSR) has no page origin: fall back to the configured URL.
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
