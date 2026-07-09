/**
 * Resolve the connecting client IP for allowlists.
 *
 * Prefer platform-injected headers (Vercel `x-vercel-forwarded-for` / `x-real-ip`)
 * over the first hop of a client-controlled `x-forwarded-for` chain.
 */

export function resolveTrustedClientIp(request: Request): string | null {
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
