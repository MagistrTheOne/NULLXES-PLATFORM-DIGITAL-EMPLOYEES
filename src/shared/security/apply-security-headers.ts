import type { NextResponse } from "next/server";
import { getSecurityHeaderEntries } from "./security-header-values";

/**
 * Best-effort hint for Cloudflare Email Obfuscation.
 *
 * CF skips HTML email rewrites when Cache-Control includes no-transform
 * (https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/).
 * Next/Vercel may later replace this header on HTML documents — root layout
 * also emits <!--email_off--> markers, and DEPLOYMENT_RF.md requires turning
 * Email Obfuscation Off in the Cloudflare dashboard.
 */
function ensureNoTransform(response: NextResponse): void {
  const existing = response.headers.get("Cache-Control");
  if (!existing) {
    response.headers.set("Cache-Control", "no-transform");
    return;
  }
  if (!/\bno-transform\b/i.test(existing)) {
    response.headers.set("Cache-Control", `${existing}, no-transform`);
  }
}

export function applySecurityHeaders(
  response: NextResponse,
  nonce?: string,
): NextResponse {
  for (const { key, value } of getSecurityHeaderEntries(nonce)) {
    response.headers.set(key, value);
  }
  ensureNoTransform(response);

  return response;
}
