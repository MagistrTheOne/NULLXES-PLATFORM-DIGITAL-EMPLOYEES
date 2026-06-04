import type { NextConfig } from "next";
import { loadEnvFiles } from "./src/shared/config/load-env-files";

loadEnvFiles();

const betterAuthUrl =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BETTER_AUTH_URL: betterAuthUrl,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.anam.ai",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
