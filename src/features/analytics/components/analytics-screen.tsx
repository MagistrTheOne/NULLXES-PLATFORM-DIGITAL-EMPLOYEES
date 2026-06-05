import type { DashboardAnalytics } from "../types";
import { AnalyticsKnowledgeOverview } from "./analytics-knowledge-overview";
import { AnalyticsKpiRow } from "./analytics-kpi-row";
import { AnalyticsRecentActivity } from "./analytics-recent-activity";
import { AnalyticsSessionTrendChart } from "./analytics-session-trend-chart";
import { AnalyticsTopEmployeesPanel } from "./analytics-top-employees-panel";

export function AnalyticsScreen({ data }: { data: DashboardAnalytics }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-white">Analytics</h1>
        <p className="mt-2 text-sm text-white/60">
          Real-time insights into your digital employees and conversations.
        </p>
      </div>

      <AnalyticsKpiRow metrics={data.metrics} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <h2 className="text-sm font-medium tracking-wide text-white/55 uppercase">
            Session Trend
          </h2>
          <AnalyticsSessionTrendChart timeseries={data.timeseries} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium tracking-wide text-white/55 uppercase">
            Employee Ranking
          </h2>
          <AnalyticsTopEmployeesPanel employees={data.topEmployees} />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AnalyticsKnowledgeOverview knowledge={data.metrics.knowledge} />
        <AnalyticsRecentActivity
          events={data.recentLifecycle}
          activity={data.metrics.activity}
        />
      </div>
    </div>
  );
}
