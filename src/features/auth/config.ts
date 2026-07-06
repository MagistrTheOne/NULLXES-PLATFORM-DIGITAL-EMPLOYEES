import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins/two-factor";
import { user } from "@/entities/user/schema";
import {
  getBetterAuthSecret,
  getBetterAuthUrl,
  getVercelDeploymentUrl,
} from "@/shared/config/env";
import {
  sendEmailVerificationEmail,
  sendExistingUserSignUpEmail,
  sendPasswordResetEmail,
} from "@/shared/email/auth-transactional-email";
import { resolveAuthEmailLocale } from "@/shared/email/resolve-auth-email-locale";
import { isEmailDeliveryConfigured } from "@/shared/email/resend-client";
import { db } from "@/shared/db/client";
import { account, session, twoFactor as twoFactorTable, verification } from "./schema";
import { buildOAuthSocialProviders } from "./lib/oauth-providers";

export function createAuthConfig(): BetterAuthOptions {
  const baseURL = getBetterAuthUrl();
  const deploymentUrl = getVercelDeploymentUrl();
  const trustedOrigins = Array.from(
    new Set([baseURL, deploymentUrl].filter(Boolean) as string[]),
  );
  const socialProviders = buildOAuthSocialProviders();
  const requireEmailVerification = isEmailDeliveryConfigured();

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
    emailVerification: {
      sendVerificationEmail: async ({ user, url }, request) => {
        const locale = resolveAuthEmailLocale(request);
        sendEmailVerificationEmail({ email: user.email, url, locale });
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification,
      revokeSessionsOnPasswordReset: true,
      customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
        ...coreFields,
        ...additionalFields,
        id,
      }),
      async onExistingUserSignUp({ user }, request) {
        const locale = resolveAuthEmailLocale(request);
        sendExistingUserSignUpEmail({ email: user.email, locale });
      },
      async sendResetPassword({ user, url }, request) {
        const locale = resolveAuthEmailLocale(request);
        sendPasswordResetEmail({ email: user.email, url, locale });
      },
    },
    plugins: [twoFactor()],
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
