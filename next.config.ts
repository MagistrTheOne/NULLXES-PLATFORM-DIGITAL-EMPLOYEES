import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { resolveAppBaseUrl } from "./src/shared/config/env";
import { loadEnvFiles } from "./src/shared/config/load-env-files";
import { getSecurityHeaderEntries } from "./src/shared/security/security-header-values";

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
  async headers() {
    // CSP is owned by src/proxy.ts (per-request nonce). Setting a second,
    // nonce-less CSP here would make browsers enforce the intersection of
    // both policies and break nonce'd scripts.
    const staticHeaders = getSecurityHeaderEntries().filter(
      (header) => header.key !== "Content-Security-Policy",
    );

    return [
      {
        source: "/:path*",
        headers: staticHeaders,
      },
    ];
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
