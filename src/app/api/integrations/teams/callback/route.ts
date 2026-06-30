import { NextResponse } from "next/server";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  getTeamsOAuthRedirectUri,
  parseIntegrationOAuthState,
  readOptionalEnvForIntegrations,
} from "@/features/integrations/lib/integration-oauth-config";
import { upsertIntegrationConnection } from "@/features/integrations/services/upsert-integration-connection";
import { resolveAppBaseUrl } from "@/shared/config/env";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const settingsUrl = new URL("/settings", resolveAppBaseUrl());
  settingsUrl.searchParams.set("tab", "integrations");

  if (!code || !state) {
    settingsUrl.searchParams.set("integration", "teams_error");
    return NextResponse.redirect(settingsUrl);
  }

  const parsedState = parseIntegrationOAuthState(state);
  if (!parsedState || parsedState.provider !== "teams") {
    settingsUrl.searchParams.set("integration", "teams_error");
    return NextResponse.redirect(settingsUrl);
  }

  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (
    workspace.organization.id !== parsedState.organizationId ||
    !workspace.permissions.canManageOrganization
  ) {
    settingsUrl.searchParams.set("integration", "forbidden");
    return NextResponse.redirect(settingsUrl);
  }

  const clientId = readOptionalEnvForIntegrations("MICROSOFT_TEAMS_CLIENT_ID");
  const clientSecret = readOptionalEnvForIntegrations(
    "MICROSOFT_TEAMS_CLIENT_SECRET",
  );
  const tenant = readOptionalEnvForIntegrations("MICROSOFT_TEAMS_TENANT_ID") ?? "common";

  if (!clientId || !clientSecret) {
    settingsUrl.searchParams.set("integration", "teams_unconfigured");
    return NextResponse.redirect(settingsUrl);
  }

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: getTeamsOAuthRedirectUri(),
      }),
    },
  );

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    settingsUrl.searchParams.set("integration", "teams_error");
    return NextResponse.redirect(settingsUrl);
  }

  await upsertIntegrationConnection({
    organizationId: workspace.organization.id,
    provider: "teams",
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token ?? null,
  });

  settingsUrl.searchParams.set("integration", "teams_connected");
  return NextResponse.redirect(settingsUrl);
}
