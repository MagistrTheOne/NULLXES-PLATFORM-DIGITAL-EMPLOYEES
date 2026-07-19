import { count, eq } from "drizzle-orm";
import { ensureOrganizationSettings } from "@/entities/organization-settings";
import { membership } from "@/entities/membership/schema";
import { getOrganizationAnalyticsRange } from "@/features/analytics/lib/get-organization-analytics-range";
import { getWorkspaceAnalytics } from "@/features/analytics/queries/get-workspace-analytics";
import { getActiveSessionCount } from "@/features/overview/queries/get-active-session-count";
import { getWorkspaceIntegrations } from "@/features/integrations/queries/get-workspace-integrations";
import { getWorkspaceIntegrationOAuthState } from "@/features/integrations/queries/get-workspace-integration-oauth-state";
import { isEmailDeliveryConfigured } from "@/shared/email/resend-client";
import { listPendingApprovals } from "@/features/agent-approval/queries/list-pending-approvals";
import { listAuditEvents } from "@/features/security/queries/list-audit-events";
import { getSecuritySnapshot } from "../queries/get-security-snapshot";
import type { WorkspaceContext } from "@/features/workspace";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { getPendingInvites } from "@/features/team/queries/get-pending-invites";
import { getTeamMembers } from "../queries/get-team-members";
import { isPlatformAdminEmail } from "@/features/admin/lib/is-platform-admin";
import type { BrainProviderReadinessMap } from "@/features/brain/lib/brain-provider-readiness";
import { getBrainProviderReadinessMap } from "@/features/brain/lib/get-brain-provider-readiness-map";
import { listOrganizationProviderKeyStatuses } from "@/features/provider-credentials";
import { countOpenEmployeeSessions } from "@/features/runtime-session/services/close-open-employee-sessions";
import { getOrganizationBillingSnapshot } from "@/features/billing/services/get-organization-billing-snapshot";
import { syncOrganizationPolarBilling } from "@/features/billing/services/sync-organization-polar-billing";
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
    defaultBrainModel: settings.defaultBrainModel,
    knowledgeProcessing: settings.knowledgeProcessing,
    sessionRetentionDays: settings.sessionRetentionDays,
    retentionPolicyDays: settings.retentionPolicyDays,
    notifySessionCompleted: settings.notifySessionCompleted,
    notifyEmployeeCreated: settings.notifyEmployeeCreated,
    notifyKnowledgeFailed: settings.notifyKnowledgeFailed,
    notifyWeeklyDigest: settings.notifyWeeklyDigest,
    requireTwoFactorForAdmins: settings.requireTwoFactorForAdmins,
    outboundWebhookUrl: settings.outboundWebhookUrl,
    outboundWebhookConfigured: Boolean(settings.outboundWebhookUrl?.trim()),
    apiIpAllowlist: settings.apiIpAllowlist,
    lastRetentionRunAt: settings.lastRetentionRunAt,
  };
}

export async function getSettingsPageData(
  workspace: WorkspaceContext,
  options?: { currentSessionId?: string | null },
): Promise<SettingsPageData> {
  return withDatabaseRetry(async () => {
    const organizationId = workspace.organization.id;
    const range = await getOrganizationAnalyticsRange(organizationId);

    const [
      settings,
      memberCountRow,
      workspaceAnalytics,
      activeNow,
      teamMembers,
      pendingInvites,
      security,
      auditResult,
      pendingApprovals,
      providerKeyStatuses,
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
        currentSessionId: options?.currentSessionId,
      }),
      listAuditEvents({ organizationId, limit: 50 }),
      listPendingApprovals(organizationId),
      listOrganizationProviderKeyStatuses(organizationId),
    ]);

    const memberCount = Number(memberCountRow[0]?.total ?? 0);
    const isPlatformAdmin = isPlatformAdminEmail(workspace.user.email);
    const openSessionCount = isPlatformAdmin
      ? await countOpenEmployeeSessions()
      : 0;

    const syncResult = await syncOrganizationPolarBilling(organizationId);
    const billingPlan = syncResult.billingPlan;

    const billing = await getOrganizationBillingSnapshot({
      organizationId,
      billingPlan,
      polarCustomerId: syncResult.polarCustomerId,
      canManageOrganization: workspace.permissions.canManageOrganization,
      customerEmail: workspace.user.email ?? undefined,
    });

    return {
      canManageOrganization: workspace.permissions.canManageOrganization,
      isPlatformAdmin,
      openSessionCount,
      canManageMembers: workspace.permissions.canManageMembers,
      currentUserId: workspace.user.id,
      actorRole: workspace.membership.role,
      organization: {
        id: workspace.organization.id,
        name: workspace.organization.name,
        type: workspace.organization.type,
        billingPlan,
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
      integrationOAuth: await getWorkspaceIntegrationOAuthState(organizationId),
      emailDeliveryConfigured: isEmailDeliveryConfigured(),
      security,
      billing,
      auditEvents: auditResult.events.map((event) => ({
        id: event.id,
        action: event.action,
        actorUserId: event.actorUserId,
        actorRole: event.actorRole,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        createdAt: event.createdAt,
      })),
      auditTotal: auditResult.total,
      pendingApprovals,
      brainProviderReadiness: await getBrainProviderReadinessMap(organizationId),
      providerKeyStatuses,
    };
  });
}
