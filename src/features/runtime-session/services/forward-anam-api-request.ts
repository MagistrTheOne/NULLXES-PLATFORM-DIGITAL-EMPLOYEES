import { getPublicAppUrl } from "@/shared/config/env";
import { isAllowedAnamProxyTarget } from "@/features/runtime-session/lib/anam-proxy-target";

function allowedCorsOrigins(): Set<string> {
  const origins = new Set<string>();

  try {
    origins.add(new URL(getPublicAppUrl()).origin);
  } catch {
    // ignore invalid public URL
  }

  for (const key of [
    "BETTER_AUTH_URL",
    "NEXT_PUBLIC_BETTER_AUTH_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
    "VERCEL_URL",
  ] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
      origins.add(new URL(withProtocol).origin);
    } catch {
      // skip
    }
  }

  return origins;
}

function corsHeadersForOrigin(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, X-Anam-Target-Url, X-Nullxes-Demo-Token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin && allowedCorsOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
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

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? body : undefined,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Upstream Anam request failed";
    return Response.json(
      { error: "anam_upstream_unreachable", message },
      {
        status: 502,
        headers: corsHeadersForOrigin(request.headers.get("origin")),
      },
    );
  }

  const responseHeaders = new Headers(
    corsHeadersForOrigin(request.headers.get("origin")),
  );
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
  return new Response(null, {
    status: 204,
    headers: corsHeadersForOrigin(request.headers.get("origin")),
  });
}
