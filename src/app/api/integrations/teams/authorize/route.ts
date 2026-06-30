import { NextResponse } from "next/server";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  buildTeamsAuthorizeUrl,
  createIntegrationOAuthState,
  isTeamsOAuthConfigured,
} from "@/features/integrations/lib/integration-oauth-config";
import { resolveAppBaseUrl } from "@/shared/config/env";

export async function GET(): Promise<Response> {
  const settingsBase = new URL("/settings", resolveAppBaseUrl());
  settingsBase.searchParams.set("tab", "integrations");

  if (!isTeamsOAuthConfigured()) {
    settingsBase.searchParams.set("integration", "teams_unconfigured");
    return NextResponse.redirect(settingsBase);
  }

  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    settingsBase.searchParams.set("integration", "forbidden");
    return NextResponse.redirect(settingsBase);
  }

  const state = createIntegrationOAuthState({
    organizationId: workspace.organization.id,
    provider: "teams",
  });

  return NextResponse.redirect(buildTeamsAuthorizeUrl(state));
}
