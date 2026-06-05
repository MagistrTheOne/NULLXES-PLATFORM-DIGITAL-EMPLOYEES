import type { EmployeeLifecycleEventType } from "@/entities/employee-lifecycle";
import type { EmployeeSessionStatus } from "@/entities/session";

export type AnalyticsDateRange = {
  from: Date;
  to: Date;
};

export type MetricTrend = {
  value: number;
  previousValue: number;
  changePercent: number | null;
};

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

export type ConversationMetrics = {
  totalMessages: number;
  averageSatisfaction: number | null;
  ratedSessions: number;
};

export type PerformanceMetrics = {
  averageFirstResponseMs: number;
  resolutionRatePercent: number;
  escalationRatePercent: number;
  completedSessions: number;
};

export type AnalyticsTrends = {
  employees: MetricTrend;
  sessions: MetricTrend;
  conversationSeconds: MetricTrend;
  messages: MetricTrend;
  satisfaction: MetricTrend | null;
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
  conversation: ConversationMetrics;
  performance: PerformanceMetrics;
  knowledge: KnowledgeMetrics;
  activity: ActivityMetrics;
  trends: AnalyticsTrends;
};

export type SessionTimeseriesPoint = {
  date: string;
  sessions: number;
  durationSeconds: number;
  previousSessions: number;
};

export type MessageTimeseriesPoint = {
  date: string;
  messages: number;
};

export type SatisfactionTimeseriesPoint = {
  date: string;
  averageRating: number | null;
  ratedSessions: number;
};

export type TopEmployeeRow = {
  employeeId: string;
  name: string;
  totalSessions: number;
  totalDurationSeconds: number;
};

export type TopicRow = {
  topic: string;
  sessionCount: number;
  sharePercent: number;
};

export type RecentSessionRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  userEmail: string;
  status: EmployeeSessionStatus;
  messageCount: number;
  satisfactionRating: number | null;
  durationSeconds: number | null;
  startedAt: Date;
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
  range: AnalyticsDateRange;
  metrics: WorkspaceAnalytics;
  timeseries: SessionTimeseriesPoint[];
  messageTimeseries: MessageTimeseriesPoint[];
  satisfactionTimeseries: SatisfactionTimeseriesPoint[];
  topEmployees: TopEmployeeRow[];
  topTopics: TopicRow[];
  recentSessions: RecentSessionRow[];
  recentLifecycle: RecentLifecycleEventRow[];
};
