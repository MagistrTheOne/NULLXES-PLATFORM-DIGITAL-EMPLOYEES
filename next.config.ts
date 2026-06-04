import type { NextConfig } from "next";

const betterAuthUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BETTER_AUTH_URL: betterAuthUrl,
  },
};

export default nextConfig;
