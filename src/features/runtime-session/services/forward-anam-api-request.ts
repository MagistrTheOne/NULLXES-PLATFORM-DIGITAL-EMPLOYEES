import { isAllowedAnamProxyTarget } from "@/features/runtime-session/lib/anam-proxy-target";

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

  if (!isAllowedAnamProxyTarget(targetUrl)) {
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

  return new Response(upstream.body, {
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
