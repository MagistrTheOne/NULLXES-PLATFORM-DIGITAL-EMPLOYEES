import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { user } from "@/entities/user/schema";
import {
  getBetterAuthSecret,
  getBetterAuthUrl,
  getVercelDeploymentUrl,
} from "@/shared/config/env";
import { sendVerificationOtpEmail } from "@/shared/email/send-verification-otp-email";
import { sendPasswordResetEmail } from "@/shared/email/send-password-reset-email";
import { db } from "@/shared/db/client";
import { account, session, twoFactor as twoFactorTable, verification } from "./schema";
import { isEmailOtpStepUpEnabled } from "./lib/email-otp-feature";
import { buildOAuthSocialProviders } from "./lib/oauth-providers";

export function createAuthConfig(): BetterAuthOptions {
  const baseURL = getBetterAuthUrl();
  const deploymentUrl = getVercelDeploymentUrl();
  const trustedOrigins = Array.from(
    new Set([baseURL, deploymentUrl].filter(Boolean) as string[]),
  );
  const socialProviders = buildOAuthSocialProviders();
  const emailOtpEnabled = isEmailOtpStepUpEnabled();

  return {
    secret: getBetterAuthSecret(),
    baseURL,
    trustedOrigins,
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      },
    },
    ...(socialProviders ? { socialProviders } : {}),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        twoFactor: twoFactorTable,
      },
    }),
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url }) {
        void sendPasswordResetEmail({ email: user.email, url });
      },
    },
    plugins: [
      twoFactor(),
      // Better Auth emailOTP — https://better-auth.com/docs/plugins/email-otp
      // Environment-gated by EMAIL_OTP_STEP_UP_ENABLED.
      ...(emailOtpEnabled
        ? [
            emailOTP({
              expiresIn: 600,
              storeOTP: "hashed",
              async sendVerificationOTP({ email, otp, type }) {
                sendVerificationOtpEmail({ email, otp, type });
              },
            }),
          ]
        : []),
    ],
    user: {
      additionalFields: {
        status: {
          type: "string",
          required: false,
          defaultValue: "active",
          input: false,
        },
        twoFactorEnabled: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },
  };
}
