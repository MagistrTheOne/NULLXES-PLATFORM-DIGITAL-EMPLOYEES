import { formatDurationSeconds } from "../lib/format-duration";
import type { DashboardAnalytics } from "../types";
import { AnalyticsConversationTimeDonut } from "./AnalyticsConversationTimeDonut";
import { AnalyticsKpiCard } from "./AnalyticsKpiCard";
import { AnalyticsKnowledgeOverview } from "./AnalyticsKnowledgeOverview";
import { AnalyticsLifecycleOverview } from "./AnalyticsLifecycleOverview";
import { AnalyticsRecentLifecycle } from "./AnalyticsRecentLifecycle";
import { AnalyticsRecentSessions } from "./AnalyticsRecentSessions";
import { AnalyticsSessionChart } from "./AnalyticsSessionChart";
import { AnalyticsStatusOverview } from "./AnalyticsStatusOverview";
import { AnalyticsTopEmployees } from "./AnalyticsTopEmployees";

export function AnalyticsScreen({ data }: { data: DashboardAnalytics }) {
  const { metrics } = data;

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Real-time insights into your digital employees and conversations.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <AnalyticsKpiCard
          title="Total Employees"
          value={String(metrics.employees.totalEmployees)}
          detail={`${metrics.employees.activeEmployees} active`}
        />
        <AnalyticsKpiCard
          title="Total Sessions"
          value={String(metrics.sessions.totalSessions)}
          detail={`${metrics.sessions.completedSessions} completed`}
        />
        <AnalyticsKpiCard
          title="Conversation Time"
          value={formatDurationSeconds(metrics.sessions.totalConversationSeconds)}
          detail={
            metrics.sessions.completedSessions > 0
              ? `Avg ${formatDurationSeconds(metrics.sessions.averageSessionDurationSeconds)}`
              : "No completed sessions yet"
          }
        />
        <AnalyticsKpiCard
          title="Knowledge Sources"
          value={String(metrics.knowledge.totalSources)}
          detail={`${metrics.knowledge.totalChunks} chunks indexed`}
        />
        <AnalyticsKpiCard
          title="Active Employees"
          value={String(metrics.employees.activeEmployees)}
          detail={`${metrics.employees.draftEmployees} draft`}
        />
      </section>

      <section className="grid gap-6 2xl:grid-cols-12">
        <div className="2xl:col-span-6">
          <AnalyticsSessionChart timeseries={data.timeseries} />
        </div>
        <div className="grid gap-6 2xl:col-span-6 2xl:grid-cols-2">
          <AnalyticsTopEmployees employees={data.topEmployees} />
          <AnalyticsConversationTimeDonut
            employees={data.topEmployees}
            totalConversationSeconds={metrics.sessions.totalConversationSeconds}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <AnalyticsKnowledgeOverview knowledge={metrics.knowledge} />
        <AnalyticsStatusOverview employees={metrics.employees} />
        <AnalyticsLifecycleOverview activity={metrics.activity} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AnalyticsRecentSessions
          employees={data.topEmployees}
          sessions={metrics.sessions}
        />
        <AnalyticsRecentLifecycle events={data.recentLifecycle} />
      </section>
    </div>
  );
}
