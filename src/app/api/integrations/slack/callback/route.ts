import { NextResponse } from "next/server";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  getSlackOAuthRedirectUri,
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
    settingsUrl.searchParams.set("integration", "slack_error");
    return NextResponse.redirect(settingsUrl);
  }

  const parsedState = parseIntegrationOAuthState(state);
  if (!parsedState || parsedState.provider !== "slack") {
    settingsUrl.searchParams.set("integration", "slack_error");
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

  const clientId = readOptionalEnvForIntegrations("SLACK_CLIENT_ID");
  const clientSecret = readOptionalEnvForIntegrations("SLACK_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    settingsUrl.searchParams.set("integration", "slack_unconfigured");
    return NextResponse.redirect(settingsUrl);
  }

  const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getSlackOAuthRedirectUri(),
    }),
  });

  const tokenPayload = (await tokenResponse.json()) as {
    ok?: boolean;
    access_token?: string;
    team?: { id?: string; name?: string };
    error?: string;
  };

  if (!tokenResponse.ok || !tokenPayload.ok || !tokenPayload.access_token) {
    settingsUrl.searchParams.set("integration", "slack_error");
    return NextResponse.redirect(settingsUrl);
  }

  await upsertIntegrationConnection({
    organizationId: workspace.organization.id,
    provider: "slack",
    externalAccountId: tokenPayload.team?.id ?? null,
    accessToken: tokenPayload.access_token,
    metadata: {
      teamName: tokenPayload.team?.name ?? null,
    },
  });

  settingsUrl.searchParams.set("integration", "slack_connected");
  return NextResponse.redirect(settingsUrl);
}
