import { getCurrentSession } from "@/features/auth/services/get-current-session";
import {
  anamProxyPreflightResponse,
  forwardAnamApiRequest,
} from "@/features/runtime-session/services/forward-anam-api-request";
import { checkRateLimit } from "@/shared/security/rate-limit";

export const runtime = "nodejs";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function handleProxy(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return anamProxyPreflightResponse(request);
  }

  const session = await getCurrentSession();
  if (!session) {
    // Landing Adeline Talk demo uses the same proxy without a workspace session.
    const rate = await checkRateLimit({
      name: "anam-proxy-public",
      key: clientIp(request),
      limit: 180,
      windowMs: 60 * 1000,
    });
    if (!rate.ok) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
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
