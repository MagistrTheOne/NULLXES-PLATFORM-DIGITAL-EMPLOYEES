import { count, eq } from "drizzle-orm";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { membership } from "@/entities/membership/schema";
import { getDefaultAnalyticsRange } from "@/features/analytics/lib/date-range";
import { getWorkspaceAnalytics } from "@/features/analytics/queries/get-workspace-analytics";
import { getActiveSessionCount } from "@/features/overview/queries/get-active-session-count";
import { getWorkspaceIntegrations } from "@/features/integrations/queries/get-workspace-integrations";
import { getSecuritySnapshot } from "../queries/get-security-snapshot";
import type { WorkspaceContext } from "@/features/workspace";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { getPendingInvites } from "@/features/team/queries/get-pending-invites";
import { getTeamMembers } from "../queries/get-team-members";
import type { OrganizationSettingsDto, SettingsPageData } from "../types";

function toSettingsDto(
  settings: Awaited<ReturnType<typeof ensureOrganizationSettings>>,
): OrganizationSettingsDto {
  return {
    website: settings.website,
    industry: settings.industry,
    timezone: settings.timezone,
    theme: settings.theme,
    language: settings.language,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    defaultTimeRangeDays: settings.defaultTimeRangeDays,
    compactMode: settings.compactMode,
    defaultBrainProvider: settings.defaultBrainProvider,
    knowledgeProcessing: settings.knowledgeProcessing,
    sessionRetentionDays: settings.sessionRetentionDays,
    retentionPolicyDays: settings.retentionPolicyDays,
    notifySessionCompleted: settings.notifySessionCompleted,
    notifyEmployeeCreated: settings.notifyEmployeeCreated,
    notifyKnowledgeFailed: settings.notifyKnowledgeFailed,
    notifyWeeklyDigest: settings.notifyWeeklyDigest,
  };
}

export async function getSettingsPageData(
  workspace: WorkspaceContext,
): Promise<SettingsPageData> {
  return withDatabaseRetry(async () => {
    const range = getDefaultAnalyticsRange();
    const organizationId = workspace.organization.id;

    const [
      settings,
      memberCountRow,
      workspaceAnalytics,
      activeNow,
      teamMembers,
      pendingInvites,
      security,
    ] = await Promise.all([
      ensureOrganizationSettings(organizationId),
      db
        .select({ total: count() })
        .from(membership)
        .where(eq(membership.organizationId, organizationId)),
      getWorkspaceAnalytics(organizationId, range),
      getActiveSessionCount(organizationId),
      getTeamMembers(organizationId),
      getPendingInvites(organizationId),
      getSecuritySnapshot({
        userId: workspace.user.id,
        organizationId,
      }),
    ]);

    const memberCount = Number(memberCountRow[0]?.total ?? 0);

    return {
      canManageOrganization: workspace.permissions.canManageOrganization,
      canManageMembers: workspace.permissions.canManageMembers,
      currentUserId: workspace.user.id,
      actorRole: workspace.membership.role,
      organization: {
        id: workspace.organization.id,
        name: workspace.organization.name,
        type: workspace.organization.type,
        billingPlan: workspace.organization.billingPlan,
        createdAt: workspace.organization.createdAt,
      },
      settings: toSettingsDto(settings),
      context: {
        memberCount,
        employeeCount: workspaceAnalytics.employees.totalEmployees,
        activeEmployees: workspaceAnalytics.employees.activeEmployees,
        activeNow,
        totalChunks: workspaceAnalytics.knowledge.totalChunks,
        usage: {
          totalSessions: workspaceAnalytics.sessions.totalSessions,
          totalConversationSeconds:
            workspaceAnalytics.sessions.totalConversationSeconds,
          totalMessages: workspaceAnalytics.conversation.totalMessages,
          totalKnowledgeSources: workspaceAnalytics.knowledge.totalSources,
          sessionTrendPercent: workspaceAnalytics.trends.sessions.changePercent,
          conversationTrendPercent:
            workspaceAnalytics.trends.conversationSeconds.changePercent,
          messagesTrendPercent: workspaceAnalytics.trends.messages.changePercent,
          knowledgeTrendPercent: null,
        },
        teamMembers,
      },
      pendingInvites,
      integrations: await getWorkspaceIntegrations(organizationId),
      security,
    };
  });
}
