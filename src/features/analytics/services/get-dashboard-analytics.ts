import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { getDefaultAnalyticsRange } from "../lib/date-range";
import { getMessageTimeseries } from "../queries/get-message-timeseries";
import { getRecentLifecycleEvents } from "../queries/get-recent-lifecycle-events";
import { getRecentSessions } from "../queries/get-recent-sessions";
import { getSatisfactionTimeseries } from "../queries/get-satisfaction-timeseries";
import { getSessionTimeseries } from "../queries/get-session-timeseries";
import { getTopEmployees } from "../queries/get-top-employees";
import { getTopTopics } from "../queries/get-top-topics";
import { getWorkspaceAnalytics } from "../queries/get-workspace-analytics";
import type { AnalyticsDateRange, DashboardAnalytics } from "../types";

export async function getDashboardAnalytics(
  organizationId: string,
  range: AnalyticsDateRange = getDefaultAnalyticsRange(),
): Promise<DashboardAnalytics> {
  return withDatabaseRetry(async () => {
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
      getWorkspaceAnalytics(organizationId, range),
      getSessionTimeseries(organizationId, range),
      getMessageTimeseries(organizationId, range),
      getSatisfactionTimeseries(organizationId, range),
      getTopEmployees(organizationId, range),
      getTopTopics(organizationId, range),
      getRecentSessions(organizationId, range),
      getRecentLifecycleEvents(organizationId),
    ]);

    return {
      range,
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
