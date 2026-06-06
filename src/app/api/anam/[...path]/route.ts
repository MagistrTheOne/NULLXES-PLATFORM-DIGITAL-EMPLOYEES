import { getCurrentSession } from "@/features/auth/services/get-current-session";
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
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
