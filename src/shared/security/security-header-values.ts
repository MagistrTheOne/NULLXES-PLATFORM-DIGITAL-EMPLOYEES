const isProduction = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * With a nonce (per-request, set by proxy) we can drop `unsafe-inline` for
 * scripts on modern browsers: only nonce'd scripts and scripts they load
 * (`strict-dynamic`) may run. The `unsafe-inline` / `https:` entries remain as
 * fallbacks for pre-CSP3 browsers, which ignore nonces and strict-dynamic —
 * CSP3 browsers ignore those fallbacks when a nonce is present.
 *
 * Without a nonce (static assets served via next.config headers) we keep the
 * legacy relaxed policy.
 */
export function buildContentSecurityPolicy(nonce?: string): string {
  const scriptSrc = nonce
    ? [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        "'unsafe-inline'",
        "https:",
        "'wasm-unsafe-eval'",
        ...(isProduction ? [] : ["'unsafe-eval'"]),
      ]
    : [
        "'self'",
        "'unsafe-inline'",
        "'wasm-unsafe-eval'",
        ...(isProduction ? [] : ["'unsafe-eval'"]),
      ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** Shared security header values for proxy middleware and next.config headers(). */
export function getSecurityHeaderEntries(
  nonce?: string,
): Array<{ key: string; value: string }> {
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
      value: buildContentSecurityPolicy(nonce),
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
