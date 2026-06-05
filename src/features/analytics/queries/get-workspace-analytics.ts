import type { WorkspaceAnalytics } from "../types";
import { getActivityMetrics } from "./get-activity-metrics";
import { getEmployeeMetrics } from "./get-employee-metrics";
import { getKnowledgeMetrics } from "./get-knowledge-metrics";
import { getSessionMetrics } from "./get-session-metrics";

export async function getWorkspaceAnalytics(
  organizationId: string,
): Promise<WorkspaceAnalytics> {
  const [employees, sessions, knowledge, activity] = await Promise.all([
    getEmployeeMetrics(organizationId),
    getSessionMetrics(organizationId),
    getKnowledgeMetrics(organizationId),
    getActivityMetrics(organizationId),
  ]);

  return {
    employees,
    sessions,
    knowledge,
    activity,
  };
}
