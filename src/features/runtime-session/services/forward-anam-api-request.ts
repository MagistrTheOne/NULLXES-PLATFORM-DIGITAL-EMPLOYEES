const ANAM_API_HOST_SUFFIX = ".anam.ai";

const BLOCKED_TARGET_PATHS = ["/v1/auth/session-token", "/v1/metrics/client"];

const ALLOWED_TARGET_PATHS = ["/v1/engine/session", "/talk"];

function isAllowedAnamTargetUrl(targetUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const isAnamHost =
    hostname === "anam.ai" || hostname.endsWith(ANAM_API_HOST_SUFFIX);

  if (!isAnamHost || parsed.protocol !== "https:") {
    return false;
  }

  const pathWithQuery = `${parsed.pathname}${parsed.search}`;

  if (
    BLOCKED_TARGET_PATHS.some((blockedPath) =>
      pathWithQuery.startsWith(blockedPath),
    )
  ) {
    return false;
  }

  return ALLOWED_TARGET_PATHS.some((allowedPath) =>
    parsed.pathname.endsWith(allowedPath),
  );
}

export async function forwardAnamApiRequest(
  request: Request,
): Promise<Response> {
  const targetUrl = request.headers.get("x-anam-target-url")?.trim();

  if (!targetUrl) {
    return Response.json(
      { error: "Missing X-Anam-Target-Url header" },
      { status: 400 },
    );
  }

  if (!isAllowedAnamTargetUrl(targetUrl)) {
    return Response.json({ error: "Target URL is not allowed" }, { status: 403 });
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: hasBody ? body : undefined,
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");

  if (upstreamContentType) {
    responseHeaders.set("Content-Type", upstreamContentType);
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export function anamProxyPreflightResponse(request: Request): Response {
  const origin = request.headers.get("origin");

  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Anam-Target-Url",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return new Response(null, { status: 204, headers });
}
