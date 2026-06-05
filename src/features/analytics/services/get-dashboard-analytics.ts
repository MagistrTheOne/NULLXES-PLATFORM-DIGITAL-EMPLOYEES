import { getRecentLifecycleEvents } from "../queries/get-recent-lifecycle-events";
import { getSessionTimeseries } from "../queries/get-session-timeseries";
import { getTopEmployees } from "../queries/get-top-employees";
import { getWorkspaceAnalytics } from "../queries/get-workspace-analytics";
import type { DashboardAnalytics } from "../types";

export async function getDashboardAnalytics(
  organizationId: string,
): Promise<DashboardAnalytics> {
  const [metrics, timeseries, topEmployees, recentLifecycle] = await Promise.all(
    [
      getWorkspaceAnalytics(organizationId),
      getSessionTimeseries(organizationId),
      getTopEmployees(organizationId),
      getRecentLifecycleEvents(organizationId),
    ],
  );

  return {
    metrics,
    timeseries,
    topEmployees,
    recentLifecycle,
  };
}
