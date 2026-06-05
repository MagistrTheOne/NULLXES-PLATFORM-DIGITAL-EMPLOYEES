import type { EmployeeLifecycleEventType } from "@/entities/employee-lifecycle";

export type EmployeeMetrics = {
  totalEmployees: number;
  activeEmployees: number;
  pausedEmployees: number;
  draftEmployees: number;
  archivedEmployees: number;
};

export type SessionMetrics = {
  totalSessions: number;
  completedSessions: number;
  averageSessionDurationSeconds: number;
  totalConversationSeconds: number;
};

export type KnowledgeMetrics = {
  totalSources: number;
  readySources: number;
  processingSources: number;
  failedSources: number;
  totalChunks: number;
};

export type ActivityMetrics = {
  createdEmployeesLast7Days: number;
  activatedEmployeesLast7Days: number;
  archivedEmployeesLast7Days: number;
};

export type WorkspaceAnalytics = {
  employees: EmployeeMetrics;
  sessions: SessionMetrics;
  knowledge: KnowledgeMetrics;
  activity: ActivityMetrics;
};

export type SessionTimeseriesPoint = {
  date: string;
  sessions: number;
  durationSeconds: number;
};

export type TopEmployeeRow = {
  employeeId: string;
  name: string;
  totalSessions: number;
  totalDurationSeconds: number;
};

export type RecentLifecycleEventRow = {
  id: string;
  eventType: EmployeeLifecycleEventType;
  reason: string | null;
  employeeId: string;
  employeeName: string;
  actorName: string;
  createdAt: Date;
};

export type DashboardAnalytics = {
  metrics: WorkspaceAnalytics;
  timeseries: SessionTimeseriesPoint[];
  topEmployees: TopEmployeeRow[];
  recentLifecycle: RecentLifecycleEventRow[];
};
