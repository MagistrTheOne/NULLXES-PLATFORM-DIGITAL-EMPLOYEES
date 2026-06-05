import type { NextRequest } from "next/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  getPolarAccessToken,
  getPolarReturnUrl,
  getPolarServer,
} from "@/features/billing/services/polar-config";

const accessToken = getPolarAccessToken();

async function resolveOrganizationExternalId(): Promise<string> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);
  return workspace.organization.id;
}

export const GET = accessToken
  ? CustomerPortal({
      accessToken,
      server: getPolarServer(),
      returnUrl: getPolarReturnUrl(),
      getExternalCustomerId: async (_req: NextRequest) =>
        resolveOrganizationExternalId(),
    })
  : async () =>
      new Response(JSON.stringify({ error: "Polar is not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
