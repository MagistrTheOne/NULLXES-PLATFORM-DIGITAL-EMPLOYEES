import type { AnalyticsDateRange, WorkspaceAnalytics } from "../types";
import { getActivityMetrics } from "./get-activity-metrics";
import { getAnalyticsTrends } from "./get-analytics-trends";
import { getConversationMetrics } from "./get-conversation-metrics";
import { getEmployeeMetrics } from "./get-employee-metrics";
import { getKnowledgeMetrics } from "./get-knowledge-metrics";
import { getPerformanceMetrics } from "./get-performance-metrics";
import { getSessionMetrics } from "./get-session-metrics";

export async function getWorkspaceAnalytics(
  organizationId: string,
  range: AnalyticsDateRange,
  employeeIds?: string[],
): Promise<WorkspaceAnalytics> {
  const [employees, sessions, conversation, performance, knowledge, activity, trends] =
    await Promise.all([
      getEmployeeMetrics(organizationId, employeeIds),
      getSessionMetrics(organizationId, range, employeeIds),
      getConversationMetrics(organizationId, range, employeeIds),
      getPerformanceMetrics(organizationId, range, employeeIds),
      getKnowledgeMetrics(organizationId),
      getActivityMetrics(organizationId),
      getAnalyticsTrends(organizationId, range, employeeIds),
    ]);

  return {
    employees,
    sessions,
    conversation,
    performance,
    knowledge,
    activity,
    trends,
  };
}
