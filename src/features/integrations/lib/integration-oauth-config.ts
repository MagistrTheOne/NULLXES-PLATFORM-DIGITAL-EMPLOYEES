import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { resolveAppBaseUrl, sanitizeEnvValue } from "@/shared/config/env";

export type IntegrationOAuthProvider = "slack" | "teams";

export function readOptionalEnvForIntegrations(name: string): string | undefined {
  const value = sanitizeEnvValue(process.env[name]);
  return value && value.length > 0 ? value : undefined;
}

function getOAuthSecret(): string {
  return (
    readOptionalEnvForIntegrations("BETTER_AUTH_SECRET") ??
    readOptionalEnvForIntegrations("DATA_ENCRYPTION_KEY") ??
    "nullxes-integration-oauth-dev"
  );
}

export function isSlackOAuthConfigured(): boolean {
  return Boolean(
    readOptionalEnvForIntegrations("SLACK_CLIENT_ID") &&
      readOptionalEnvForIntegrations("SLACK_CLIENT_SECRET"),
  );
}

export function isTeamsOAuthConfigured(): boolean {
  return Boolean(
    readOptionalEnvForIntegrations("MICROSOFT_TEAMS_CLIENT_ID") &&
      readOptionalEnvForIntegrations("MICROSOFT_TEAMS_CLIENT_SECRET"),
  );
}

export function isIntegrationOAuthConfigured(
  provider: IntegrationOAuthProvider,
): boolean {
  return provider === "slack"
    ? isSlackOAuthConfigured()
    : isTeamsOAuthConfigured();
}

export function createIntegrationOAuthState(input: {
  organizationId: string;
  provider: IntegrationOAuthProvider;
}): string {
  const payload = Buffer.from(
    JSON.stringify({
      organizationId: input.organizationId,
      provider: input.provider,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");

  const signature = createHmac("sha256", getOAuthSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function parseIntegrationOAuthState(
  state: string,
): { organizationId: string; provider: IntegrationOAuthProvider } | null {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getOAuthSecret())
    .update(payload)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      organizationId?: string;
      provider?: IntegrationOAuthProvider;
    };

    if (
      !parsed.organizationId ||
      (parsed.provider !== "slack" && parsed.provider !== "teams")
    ) {
      return null;
    }

    return {
      organizationId: parsed.organizationId,
      provider: parsed.provider,
    };
  } catch {
    return null;
  }
}

export function getSlackOAuthRedirectUri(): string {
  return `${resolveAppBaseUrl()}/api/integrations/slack/callback`;
}

export function getTeamsOAuthRedirectUri(): string {
  return `${resolveAppBaseUrl()}/api/integrations/teams/callback`;
}

export function buildSlackAuthorizeUrl(state: string): string {
  const clientId = readOptionalEnvForIntegrations("SLACK_CLIENT_ID");
  if (!clientId) {
    throw new Error("SLACK_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "channels:read,chat:write,users:read",
    redirect_uri: getSlackOAuthRedirectUri(),
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export function buildTeamsAuthorizeUrl(state: string): string {
  const clientId = readOptionalEnvForIntegrations("MICROSOFT_TEAMS_CLIENT_ID");
  if (!clientId) {
    throw new Error("MICROSOFT_TEAMS_CLIENT_ID is not configured");
  }

  const tenant = readOptionalEnvForIntegrations("MICROSOFT_TEAMS_TENANT_ID") ?? "common";
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getTeamsOAuthRedirectUri(),
    response_mode: "query",
    scope: "offline_access Channel.ReadBasic.All",
    state,
  });

  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
}
