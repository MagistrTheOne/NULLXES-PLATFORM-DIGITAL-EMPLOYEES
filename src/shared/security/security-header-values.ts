const isProduction = process.env.NODE_ENV === "production";

/** Shared security header values for proxy middleware and next.config headers(). */
export function getSecurityHeaderEntries(): Array<{ key: string; value: string }> {
  const entries: Array<{ key: string; value: string }> = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(self), microphone=(self), geolocation=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        isProduction
          ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'"
          : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https: wss:",
        "media-src 'self' blob: https:",
        "frame-src 'self' https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    },
  ];

  if (isProduction) {
    entries.unshift({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return entries;
}
