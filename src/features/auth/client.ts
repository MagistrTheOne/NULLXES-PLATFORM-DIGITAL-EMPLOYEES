import { createAuthClient } from "better-auth/react";

// Set NEXT_PUBLIC_BETTER_AUTH_URL in .env (e.g. http://localhost:3000)
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
