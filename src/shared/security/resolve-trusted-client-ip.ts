/**
 * Resolve the connecting client IP for allowlists and public demo quotas.
 *
 * Prefer edge-injected headers over client-controlled XFF:
 * 1. Cloudflare `CF-Connecting-IP` (Verified Proxy Lite)
 * 2. Vercel `x-vercel-forwarded-for` / `x-real-ip`
 * 3. Right-most `x-forwarded-for` hop (closest to our edge)
 *
 * @see https://vercel.com/docs/security/reverse-proxy
 * @see docs/DEPLOYMENT_RF.md
 */

export function resolveTrustedClientIp(request: Request): string | null {
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0]?.trim() || null;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  // Last resort: only the right-most (closest to our edge) XFF hop is somewhat
  // trustworthy when a reverse proxy appends; still weaker than platform headers.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      return hops[hops.length - 1] ?? null;
    }
  }

  return null;
}

/** Rate-limit key for unauthenticated public surfaces (landing demos). */
export function resolvePublicClientIpKey(request: Request): string {
  return resolveTrustedClientIp(request) ?? "unknown";
}
