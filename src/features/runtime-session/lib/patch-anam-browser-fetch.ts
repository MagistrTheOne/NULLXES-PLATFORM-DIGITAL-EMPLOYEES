const ANAM_API_ORIGIN = "https://api.anam.ai";
const ANAM_CLIENT_METRICS_SUFFIX = "/v1/metrics/client";
const ANAM_PROXY_PREFIX = "/api/anam";

let installed = false;

function resolveFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

function buildProxyUrl(targetUrl: string): string {
  const pathAndQuery = targetUrl.slice(ANAM_API_ORIGIN.length);
  return `${window.location.origin}${ANAM_PROXY_PREFIX}${pathAndQuery}`;
}

/**
 * The Anam JS SDK calls api.anam.ai from the browser. That origin does not
 * expose CORS headers for custom deployments, so session start fails.
 *
 * Route those requests through our same-origin /api/anam proxy instead.
 * Metrics are dropped — Talk does not depend on client telemetry.
 */
export function patchAnamBrowserFetch(): void {
  if (installed || typeof window === "undefined") {
    return;
  }
  installed = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = resolveFetchUrl(input);

    if (url.includes(ANAM_CLIENT_METRICS_SUFFIX)) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }

    if (url.startsWith(ANAM_API_ORIGIN)) {
      const headers = new Headers(init?.headers);
      headers.set("X-Anam-Target-Url", url);

      return nativeFetch(buildProxyUrl(url), {
        ...init,
        headers,
      });
    }

    return nativeFetch(input, init);
  };
}
