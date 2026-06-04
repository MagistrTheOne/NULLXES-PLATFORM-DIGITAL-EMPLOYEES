import { betterAuth } from "better-auth";
import { createAuthConfig } from "./config";

export const auth = betterAuth(createAuthConfig());
