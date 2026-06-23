import { getDefaultAnalyticsRange } from "@/features/analytics/lib/date-range";
import { getRecentLifecycleEvents } from "@/features/analytics/queries/get-recent-lifecycle-events";
import { getWorkspaceAnalytics } from "@/features/analytics/queries/get-workspace-analytics";
import type { AnalyticsDateRange } from "@/features/analytics/types";
import { listOrganizationEmployees } from "@/features/employees/services/list-organization-employees";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { getActiveSessionCount } from "../queries/get-active-session-count";
import { getEmployeeSessionSummaries } from "../queries/get-employee-session-summaries";
import { getOvernightWorkEvents } from "../queries/get-overnight-work-events";
import { getLiveSessions } from "../queries/get-live-sessions";
import type { DashboardOverview, OverviewEmployee } from "../types";
import { getSystemStatus } from "./get-system-status";

function mergeEmployees(
  employees: Awaited<ReturnType<typeof listOrganizationEmployees>>["items"],
  summaries: Awaited<ReturnType<typeof getEmployeeSessionSummaries>>,
): OverviewEmployee[] {
  const summaryByEmployeeId = new Map(
    summaries.map((summary) => [summary.employeeId, summary]),
  );

  return employees.map((employee) => {
    const summary = summaryByEmployeeId.get(employee.id);

    return {
      ...employee,
      sessionsInRange: summary?.sessionsInRange ?? 0,
      lastSessionAt: summary?.lastSessionAt ?? null,
    };
  });
}

export async function getDashboardOverview(
  organizationId: string,
  range: AnalyticsDateRange = getDefaultAnalyticsRange(),
): Promise<DashboardOverview> {
  return withDatabaseRetry(async () => {
    const [
      workspace,
      employees,
      sessionSummaries,
      liveSessions,
      activeNow,
      recentActivity,
      overnightWork,
    ] = await Promise.all([
      getWorkspaceAnalytics(organizationId, range),
      listOrganizationEmployees(organizationId).then((page) => page.items),
      getEmployeeSessionSummaries(organizationId, range),
      getLiveSessions(organizationId),
      getActiveSessionCount(organizationId),
      getRecentLifecycleEvents(organizationId),
      getOvernightWorkEvents(organizationId),
    ]);

    return {
      range,
      metrics: {
        employees: {
          total: workspace.employees.totalEmployees,
          active: workspace.employees.activeEmployees,
        },
        sessions: workspace.sessions,
        conversation: workspace.conversation,
        knowledge: workspace.knowledge,
        trends: workspace.trends,
        activeNow,
      },
      employees: mergeEmployees(employees, sessionSummaries),
      liveSessions,
      recentActivity,
      overnightWork,
      systemStatus: getSystemStatus(),
    };
  });
}
