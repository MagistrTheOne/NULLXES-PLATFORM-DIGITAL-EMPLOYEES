import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins/two-factor";
import { user } from "@/entities/user/schema";
import {
  getBetterAuthSecret,
  getBetterAuthUrl,
} from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { account, session, twoFactor as twoFactorTable, verification } from "./schema";

export function createAuthConfig(): BetterAuthOptions {
  const baseURL = getBetterAuthUrl();

  return {
    secret: getBetterAuthSecret(),
    baseURL,
    trustedOrigins: [baseURL],
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
