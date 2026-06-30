import { eq } from "drizzle-orm";
import { integrationConnection } from "@/entities/integration-connection/schema";
import {
  isIntegrationOAuthConfigured,
  isSlackOAuthConfigured,
  isTeamsOAuthConfigured,
} from "@/features/integrations/lib/integration-oauth-config";
import { db } from "@/shared/db/client";
import type { WorkspaceIntegrationOAuthState } from "../types/workspace-integration-oauth-state";

export type { WorkspaceIntegrationOAuthState };

export async function getWorkspaceIntegrationOAuthState(
  organizationId: string,
): Promise<WorkspaceIntegrationOAuthState> {
  const rows = await db
    .select({
      provider: integrationConnection.provider,
      status: integrationConnection.status,
    })
    .from(integrationConnection)
    .where(eq(integrationConnection.organizationId, organizationId));

  const slackRow = rows.find((row) => row.provider === "slack");
  const teamsRow = rows.find((row) => row.provider === "teams");

  return {
    slack: {
      oauthConfigured: isSlackOAuthConfigured(),
      connected: slackRow?.status === "connected",
    },
    teams: {
      oauthConfigured: isTeamsOAuthConfigured(),
      connected: teamsRow?.status === "connected",
    },
  };
}

export function isAnyIntegrationOAuthConfigured(): boolean {
  return (
    isIntegrationOAuthConfigured("slack") || isIntegrationOAuthConfigured("teams")
  );
}
