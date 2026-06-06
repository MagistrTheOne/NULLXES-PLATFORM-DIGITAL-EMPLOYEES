import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins/two-factor";
import { user } from "@/entities/user/schema";
import {
  getBetterAuthSecret,
  getBetterAuthUrl,
  getVercelDeploymentUrl,
} from "@/shared/config/env";
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

  return {
    secret: getBetterAuthSecret(),
    baseURL,
    trustedOrigins,
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
