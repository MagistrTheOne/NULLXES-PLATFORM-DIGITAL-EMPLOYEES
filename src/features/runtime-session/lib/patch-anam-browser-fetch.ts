import {
  buildAnamProxyUrl,
  shouldProxyAnamBrowserFetch,
} from "./anam-proxy-target";

const ANAM_CLIENT_METRICS_SUFFIX = "/v1/metrics/client";

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

/**
 * The Anam JS SDK calls *.anam.ai from the browser (api.anam.ai for session
 * start, engine hosts for /talk). Those origins do not expose CORS for custom
 * deployments — route all SDK HTTP through our same-origin /api/anam proxy.
 * Metrics are dropped; WebRTC / WebSocket signalling stay direct.
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

    if (shouldProxyAnamBrowserFetch(url)) {
      const headers = new Headers(init?.headers);
      headers.set("X-Anam-Target-Url", url);

      return nativeFetch(buildAnamProxyUrl(url, window.location.origin), {
        ...init,
        headers,
        credentials: init?.credentials ?? "include",
      });
    }

    return nativeFetch(input, init);
  };
}
