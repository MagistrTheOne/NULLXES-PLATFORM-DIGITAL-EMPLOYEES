import { formatDurationSeconds } from "../lib/format-duration";
import type { DashboardAnalytics } from "../types";
import { AnalyticsConversationTimeDonut } from "./AnalyticsConversationTimeDonut";
import { AnalyticsHeaderControls } from "./AnalyticsHeaderControls";
import { AnalyticsKpiCard } from "./AnalyticsKpiCard";
import { AnalyticsKnowledgeOverview } from "./AnalyticsKnowledgeOverview";
import { AnalyticsLifecycleOverview } from "./AnalyticsLifecycleOverview";
import { AnalyticsMessageVolumeChart } from "./AnalyticsMessageVolumeChart";
import { AnalyticsPerformanceOverview } from "./AnalyticsPerformanceOverview";
import { AnalyticsRecentLifecycle } from "./AnalyticsRecentLifecycle";
import { AnalyticsRecentSessions } from "./AnalyticsRecentSessions";
import { AnalyticsSatisfactionTrend } from "./AnalyticsSatisfactionTrend";
import { AnalyticsSessionChart } from "./AnalyticsSessionChart";
import { AnalyticsStatusOverview } from "./AnalyticsStatusOverview";
import { AnalyticsTopEmployees } from "./AnalyticsTopEmployees";
import { AnalyticsTopTopics } from "./AnalyticsTopTopics";

export function AnalyticsScreen({ data }: { data: DashboardAnalytics }) {
  const { metrics } = data;

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real-time insights into your digital employees and conversations.
          </p>
        </div>
        <AnalyticsHeaderControls range={data.range} data={data} />
      </header>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <AnalyticsKpiCard
          title="Total Employees"
          value={String(metrics.employees.totalEmployees)}
          detail={`${metrics.employees.activeEmployees} active`}
          trend={metrics.trends.employees}
        />
        <AnalyticsKpiCard
          title="Total Sessions"
          value={String(metrics.sessions.totalSessions)}
          detail={`${metrics.sessions.completedSessions} completed`}
          trend={metrics.trends.sessions}
        />
        <AnalyticsKpiCard
          title="Conversation Time"
          value={formatDurationSeconds(metrics.sessions.totalConversationSeconds)}
          detail={
            metrics.sessions.completedSessions > 0
              ? `Avg ${formatDurationSeconds(metrics.sessions.averageSessionDurationSeconds)}`
              : "No completed sessions yet"
          }
          trend={metrics.trends.conversationSeconds}
        />
        <AnalyticsKpiCard
          title="Total Messages"
          value={String(metrics.conversation.totalMessages)}
          detail={
            metrics.conversation.totalMessages > 0
              ? `${metrics.conversation.ratedSessions} rated sessions`
              : "No messages in this period"
          }
          trend={metrics.trends.messages}
        />
        <AnalyticsKpiCard
          title="Avg. Satisfaction"
          value={
            metrics.conversation.averageSatisfaction !== null
              ? `${metrics.conversation.averageSatisfaction.toFixed(1)} / 5`
              : "—"
          }
          detail={
            metrics.conversation.ratedSessions > 0
              ? `${metrics.conversation.ratedSessions} ratings`
              : "No ratings in this period"
          }
          trend={metrics.trends.satisfaction}
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
        <AnalyticsMessageVolumeChart timeseries={data.messageTimeseries} />
        <AnalyticsSatisfactionTrend timeseries={data.satisfactionTimeseries} />
        <AnalyticsTopTopics topics={data.topTopics} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <AnalyticsKnowledgeOverview knowledge={metrics.knowledge} />
        <AnalyticsStatusOverview employees={metrics.employees} />
        <AnalyticsLifecycleOverview activity={metrics.activity} />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <AnalyticsRecentSessions sessions={data.recentSessions} />
        </div>
        <div className="xl:col-span-4">
          <AnalyticsPerformanceOverview performance={metrics.performance} />
        </div>
      </section>

      <section>
        <AnalyticsRecentLifecycle events={data.recentLifecycle} />
      </section>
    </div>
  );
}
