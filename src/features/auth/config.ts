import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { user } from "@/entities/user/schema";
import {
  getBetterAuthSecret,
  getBetterAuthUrl,
} from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { account, session, verification } from "./schema";

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
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        status: {
          type: "string",
          required: false,
          defaultValue: "active",
          input: false,
        },
      },
    },
  };
}
