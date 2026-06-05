import type { AnalyticsDateRange, AnalyticsTrends } from "@/features/analytics";
import type {
  ConversationMetrics,
  KnowledgeMetrics,
  RecentLifecycleEventRow,
  SessionMetrics,
} from "@/features/analytics/types";
import type { EmployeeListItem } from "@/features/employees/types";
import type { EmployeeSessionStatus } from "@/entities/session";

export type EmployeeSessionSummary = {
  employeeId: string;
  sessionsInRange: number;
  lastSessionAt: Date | null;
};

export type OverviewEmployee = EmployeeListItem & {
  sessionsInRange: number;
  lastSessionAt: Date | null;
};

export type LiveSessionRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  userEmail: string;
  status: EmployeeSessionStatus;
  startedAt: Date;
};

export type SystemStatusState = "operational" | "degraded" | "unavailable";

export type SystemStatusItem = {
  label: string;
  status: SystemStatusState;
  detail: string;
};

export type OverviewMetrics = {
  employees: {
    total: number;
    active: number;
  };
  sessions: SessionMetrics;
  conversation: ConversationMetrics;
  knowledge: KnowledgeMetrics;
  trends: AnalyticsTrends;
  activeNow: number;
};

export type DashboardOverview = {
  range: AnalyticsDateRange;
  metrics: OverviewMetrics;
  employees: OverviewEmployee[];
  liveSessions: LiveSessionRow[];
  recentActivity: RecentLifecycleEventRow[];
  systemStatus: SystemStatusItem[];
};
