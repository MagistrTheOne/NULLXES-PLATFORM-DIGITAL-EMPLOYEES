const ANAM_HOST_SUFFIX = ".anam.ai";
const ANAM_PROXY_PREFIX = "/api/anam";
const ANAM_CLIENT_METRICS_SUFFIX = "/v1/metrics/client";

/** Server/admin paths — never proxy from the browser. */
const BLOCKED_ANAM_TARGET_PREFIXES = [
  "/v1/auth/session-token",
  "/v1/metrics/client",
  "/avatars",
  "/personas",
  "/voices",
] as const;

export function isAnamHttpsTargetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    return (
      parsed.protocol === "https:" &&
      (hostname === "anam.ai" || hostname.endsWith(ANAM_HOST_SUFFIX))
    );
  } catch {
    return false;
  }
}

export function isBlockedAnamTargetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return BLOCKED_ANAM_TARGET_PREFIXES.some(
      (prefix) =>
        parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`),
    );
  } catch {
    return true;
  }
}

export function shouldProxyAnamBrowserFetch(url: string): boolean {
  return isAnamHttpsTargetUrl(url) && !url.includes(ANAM_CLIENT_METRICS_SUFFIX);
}

export function isAllowedAnamProxyTarget(url: string): boolean {
  return isAnamHttpsTargetUrl(url) && !isBlockedAnamTargetUrl(url);
}

export function buildAnamProxyUrl(targetUrl: string, origin: string): string {
  const parsed = new URL(targetUrl);
  return `${origin}${ANAM_PROXY_PREFIX}${parsed.pathname}${parsed.search}`;
}
