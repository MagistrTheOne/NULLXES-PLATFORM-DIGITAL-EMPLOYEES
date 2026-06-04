import { createAuthClient } from "better-auth/react";
import { getPublicBetterAuthUrl } from "@/shared/config/env";

export const authClient = createAuthClient({
  baseURL: getPublicBetterAuthUrl(),
});
