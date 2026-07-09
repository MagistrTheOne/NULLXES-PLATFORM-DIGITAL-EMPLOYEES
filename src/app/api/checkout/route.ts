import type { NextRequest } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  getPolarAccessToken,
  getPolarReturnUrl,
  getPolarServer,
  getPolarSuccessUrl,
} from "@/features/billing/services/polar-config";

const accessToken = getPolarAccessToken();

const polarCheckout = accessToken
  ? Checkout({
      accessToken,
      successUrl: getPolarSuccessUrl(),
      returnUrl: getPolarReturnUrl(),
      server: getPolarServer(),
      theme: "dark",
    })
  : null;

/**
 * Polar Checkout reads `customerExternalId` from the query string.
 * Without a session gate, anyone could start checkout for another org UUID
 * and later Polar webhooks would attach billing to that org.
 *
 * Require an authenticated org admin and overwrite external id + email
 * from the server-side workspace — never trust the client.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!polarCheckout) {
    return Response.json({ error: "Polar is not configured" }, { status: 503 });
  }

  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  if (!workspace.permissions.canManageOrganization) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = request.nextUrl.clone();
  url.searchParams.set("customerExternalId", workspace.organization.id);
  if (session.user.email) {
    url.searchParams.set("customerEmail", session.user.email);
  }

  return polarCheckout(
    new Request(url, {
      method: "GET",
      headers: request.headers,
    }) as NextRequest,
  );
}
