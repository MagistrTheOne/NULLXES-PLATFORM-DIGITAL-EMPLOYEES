import { getCurrentSession } from "@/features/auth/services/get-current-session";
import {
  LANDING_DEMO_TOKEN_HEADER,
  verifyLandingDemoToken,
} from "@/features/landing/lib/landing-demo-token";
import {
  consumeAnamProxyQuota,
  consumePlatformAnamQuota,
} from "@/features/runtime-session/lib/anam-proxy-quota";
import {
  anamProxyPreflightResponse,
  forwardAnamApiRequest,
} from "@/features/runtime-session/services/forward-anam-api-request";

export const runtime = "nodejs";

async function handleProxy(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return anamProxyPreflightResponse(request);
  }

  const session = await getCurrentSession();
  const demoToken = request.headers.get(LANDING_DEMO_TOKEN_HEADER);
  const demoOk = verifyLandingDemoToken(demoToken);

  if (!session && !demoOk) {
    return Response.json(
      { error: "Authentication required for Anam proxy." },
      { status: 401 },
    );
  }

  const subject = session
    ? `user:${session.user.id}`
    : "demo:landing-adeline";

  const platform = await consumePlatformAnamQuota();
  if (!platform.ok) {
    return Response.json(
      { error: "Platform Anam quota exceeded. Try again shortly." },
      { status: 429 },
    );
  }

  const bucket = await consumeAnamProxyQuota({
    subject,
    perMinute: session ? 90 : 30,
  });
  if (!bucket.ok) {
    return Response.json(
      { error: "Too many Anam proxy requests." },
      { status: 429 },
    );
  }

  return forwardAnamApiRequest(request);
}

export async function GET(request: Request): Promise<Response> {
  return handleProxy(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleProxy(request);
}

export async function HEAD(request: Request): Promise<Response> {
  return handleProxy(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return handleProxy(request);
}
