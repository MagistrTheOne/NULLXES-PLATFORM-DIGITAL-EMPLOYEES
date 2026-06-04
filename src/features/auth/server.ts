import { betterAuth } from "better-auth/minimal";
import { createAuthConfig } from "./config";

export const auth = betterAuth(createAuthConfig());
