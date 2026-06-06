const ANAM_CLIENT_METRICS_SUFFIX = "/v1/metrics/client";

let installed = false;

/**
 * The Anam JS SDK posts browser telemetry to api.anam.ai/v1/metrics/client.
 * That endpoint does not send CORS headers for custom app origins, so the
 * browser logs a noisy (harmless) error. Talk does not depend on these metrics.
 *
 * `disableClientMetrics` on createClient should be enough, but Next.js can
 * bundle ClientMetrics more than once — this fetch guard is the fallback.
 */
export function suppressAnamClientMetricsFetch(): void {
  if (installed || typeof window === "undefined") {
    return;
  }
  installed = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (url.includes(ANAM_CLIENT_METRICS_SUFFIX)) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }

    return nativeFetch(input, init);
  };
}
