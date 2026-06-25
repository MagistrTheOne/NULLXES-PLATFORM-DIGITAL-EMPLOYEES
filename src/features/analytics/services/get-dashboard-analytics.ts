import type { HqDepartment } from "@/features/hq/types";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { buildDateRange, getDefaultAnalyticsRange } from "../lib/date-range";
import { getDepartmentEmployeeIds } from "../queries/get-department-employee-ids";
import { getMessageTimeseries } from "../queries/get-message-timeseries";
import { getRecentLifecycleEvents } from "../queries/get-recent-lifecycle-events";
import { getRecentSessions } from "../queries/get-recent-sessions";
import { getSatisfactionTimeseries } from "../queries/get-satisfaction-timeseries";
import { getSessionTimeseries } from "../queries/get-session-timeseries";
import { getTopEmployees } from "../queries/get-top-employees";
import { getTopTopics } from "../queries/get-top-topics";
import { getWorkspaceAnalytics } from "../queries/get-workspace-analytics";
import type { AnalyticsDateRange, DashboardAnalytics } from "../types";

const ZERO_TREND = { value: 0, previousValue: 0, changePercent: null };

/** Empty result used when a department has no employees (avoids dead queries). */
function buildEmptyDashboard(
  range: AnalyticsDateRange,
  department: HqDepartment,
): DashboardAnalytics {
  return {
    range,
    department,
    metrics: {
      employees: {
        totalEmployees: 0,
        activeEmployees: 0,
        pausedEmployees: 0,
        draftEmployees: 0,
        archivedEmployees: 0,
      },
      sessions: {
        totalSessions: 0,
        completedSessions: 0,
        averageSessionDurationSeconds: 0,
        totalConversationSeconds: 0,
      },
      conversation: {
        totalMessages: 0,
        averageSatisfaction: null,
        ratedSessions: 0,
      },
      performance: {
        averageFirstResponseMs: 0,
        resolutionRatePercent: 0,
        escalationRatePercent: 0,
        completedSessions: 0,
      },
      knowledge: {
        totalSources: 0,
        readySources: 0,
        processingSources: 0,
        failedSources: 0,
        totalChunks: 0,
      },
      activity: {
        createdEmployeesLast7Days: 0,
        activatedEmployeesLast7Days: 0,
        archivedEmployeesLast7Days: 0,
      },
      trends: {
        employees: ZERO_TREND,
        sessions: ZERO_TREND,
        conversationSeconds: ZERO_TREND,
        messages: ZERO_TREND,
        satisfaction: null,
      },
    },
    timeseries: buildDateRange(range).map((date) => ({
      date,
      sessions: 0,
      durationSeconds: 0,
      previousSessions: 0,
    })),
    messageTimeseries: buildDateRange(range).map((date) => ({
      date,
      messages: 0,
    })),
    satisfactionTimeseries: buildDateRange(range).map((date) => ({
      date,
      averageRating: null,
      ratedSessions: 0,
    })),
    topEmployees: [],
    topTopics: [],
    recentSessions: [],
    recentLifecycle: [],
  };
}

export async function getDashboardAnalytics(
  organizationId: string,
  range: AnalyticsDateRange = getDefaultAnalyticsRange(),
  department: HqDepartment | null = null,
): Promise<DashboardAnalytics> {
  return withDatabaseRetry(async () => {
    let employeeIds: string[] | undefined;
    if (department) {
      employeeIds = await getDepartmentEmployeeIds(organizationId, department);
      if (employeeIds.length === 0) {
        return buildEmptyDashboard(range, department);
      }
    }

    const [
      metrics,
      timeseries,
      messageTimeseries,
      satisfactionTimeseries,
      topEmployees,
      topTopics,
      recentSessions,
      recentLifecycle,
    ] = await Promise.all([
      getWorkspaceAnalytics(organizationId, range, employeeIds),
      getSessionTimeseries(organizationId, range, employeeIds),
      getMessageTimeseries(organizationId, range, employeeIds),
      getSatisfactionTimeseries(organizationId, range, employeeIds),
      getTopEmployees(organizationId, range, employeeIds),
      getTopTopics(organizationId, range, 6, employeeIds),
      getRecentSessions(organizationId, range, 12, employeeIds),
      getRecentLifecycleEvents(organizationId),
    ]);

    return {
      range,
      department,
      metrics,
      timeseries,
      messageTimeseries,
      satisfactionTimeseries,
      topEmployees,
      topTopics,
      recentSessions,
      recentLifecycle,
    };
  });
}
