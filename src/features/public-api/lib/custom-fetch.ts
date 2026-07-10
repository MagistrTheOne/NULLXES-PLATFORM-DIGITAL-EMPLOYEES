/**
 * Fetch mutator for Orval-generated Public API client.
 *
 * Paths in `openapi.yaml` are relative to `servers.url` (`/api/v1`).
 * Pass `Authorization: Bearer nx_live_...` via `options.headers`, or set
 * `apiKey` / `baseUrl` on the options object (stripped before fetch).
 */
export type CustomFetchOptions = RequestInit & {
  apiKey?: string;
  /** Origin only, e.g. `https://www.nullxesdai.online`. Paths stay under `/api/v1`. */
  baseUrl?: string;
};

const API_PREFIX = "/api/v1";

function resolveUrl(url: string, baseUrl?: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const path = url.startsWith(API_PREFIX)
    ? url
    : `${API_PREFIX}${url.startsWith("/") ? url : `/${url}`}`;

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function customFetch<T>(
  url: string,
  options: CustomFetchOptions = {},
): Promise<T> {
  const { apiKey, baseUrl, headers, ...init } = options;

  const response = await fetch(resolveUrl(url, baseUrl), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data =
    contentType.includes("application/json")
      ? await response.json()
      : await response.text();

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
}
