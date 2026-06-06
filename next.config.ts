import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { resolveAppBaseUrl } from "./src/shared/config/env";
import { loadEnvFiles } from "./src/shared/config/load-env-files";

loadEnvFiles();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const betterAuthUrl = (() => {
  try {
    return resolveAppBaseUrl();
  } catch {
    return (
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
      process.env.BETTER_AUTH_URL ??
      "http://localhost:3000"
    );
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
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

export default withNextIntl(nextConfig);
