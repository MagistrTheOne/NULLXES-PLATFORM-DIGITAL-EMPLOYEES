"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDurationSeconds } from "../lib/format-duration";
import type { DashboardAnalytics } from "../types";
import { AnalyticsConversationTimeDonut } from "./AnalyticsConversationTimeDonut";
import { AnalyticsDepartmentFilter } from "./AnalyticsDepartmentFilter";
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
  const t = useTranslations("analytics");
  const tDepartments = useTranslations("hq.departments");
  const { metrics } = data;

  const sessionSeries = data.timeseries.map((point) => point.sessions);
  const durationSeries = data.timeseries.map((point) => point.durationSeconds);
  const messageSeries = data.messageTimeseries.map((point) => point.messages);
  const satisfactionSeries = data.satisfactionTimeseries.map(
    (point) => point.averageRating ?? 0,
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.department
              ? t("departmentScope.viewing", {
                  department: tDepartments(data.department),
                })
              : t("subtitle")}
          </p>
        </div>
        <AnalyticsHeaderControls range={data.range} data={data} />
      </header>

      <AnalyticsDepartmentFilter active={data.department} />

      <Tabs defaultValue="overview" className="w-full gap-6">
        <TabsList>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="conversations">
            {t("tabs.conversations")}
          </TabsTrigger>
          <TabsTrigger value="workforce">{t("tabs.workforce")}</TabsTrigger>
          <TabsTrigger value="knowledge">{t("tabs.knowledge")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AnalyticsKpiCard
              title={t("kpi.totalEmployees")}
              value={String(metrics.employees.totalEmployees)}
              detail={t("kpi.active", {
                count: metrics.employees.activeEmployees,
              })}
              trend={metrics.trends.employees}
            />
            <AnalyticsKpiCard
              title={t("kpi.totalSessions")}
              value={String(metrics.sessions.totalSessions)}
              detail={t("kpi.completed", {
                count: metrics.sessions.completedSessions,
              })}
              trend={metrics.trends.sessions}
              series={sessionSeries}
            />
            <AnalyticsKpiCard
              title={t("kpi.conversationTime")}
              value={formatDurationSeconds(
                metrics.sessions.totalConversationSeconds,
              )}
              detail={
                metrics.sessions.completedSessions > 0
                  ? t("kpi.avgDuration", {
                      duration: formatDurationSeconds(
                        metrics.sessions.averageSessionDurationSeconds,
                      ),
                    })
                  : t("kpi.noCompletedSessions")
              }
              trend={metrics.trends.conversationSeconds}
              series={durationSeries}
            />
            <AnalyticsKpiCard
              title={t("kpi.totalMessages")}
              value={String(metrics.conversation.totalMessages)}
              detail={
                metrics.conversation.totalMessages > 0
                  ? t("kpi.ratedSessions", {
                      count: metrics.conversation.ratedSessions,
                    })
                  : t("kpi.noMessages")
              }
              trend={metrics.trends.messages}
              series={messageSeries}
            />
            <AnalyticsKpiCard
              title={t("kpi.avgSatisfaction")}
              value={
                metrics.conversation.averageSatisfaction !== null
                  ? `${metrics.conversation.averageSatisfaction.toFixed(1)} / 5`
                  : "—"
              }
              detail={
                metrics.conversation.ratedSessions > 0
                  ? t("kpi.ratings", {
                      count: metrics.conversation.ratedSessions,
                    })
                  : t("kpi.noRatings")
              }
              trend={metrics.trends.satisfaction}
              series={satisfactionSeries}
            />
          </section>

          <section className="grid gap-6 2xl:grid-cols-12">
            <div className="2xl:col-span-7">
              <AnalyticsSessionChart timeseries={data.timeseries} />
            </div>
            <div className="2xl:col-span-5">
              <AnalyticsTopEmployees employees={data.topEmployees} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="conversations" className="flex flex-col gap-6">
          <section className="grid gap-6 lg:grid-cols-2">
            <AnalyticsMessageVolumeChart timeseries={data.messageTimeseries} />
            <AnalyticsSatisfactionTrend
              timeseries={data.satisfactionTimeseries}
            />
          </section>
          <section className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <AnalyticsRecentSessions sessions={data.recentSessions} />
            </div>
            <div className="xl:col-span-4">
              <AnalyticsTopTopics topics={data.topTopics} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="workforce" className="flex flex-col gap-6">
          <section className="grid gap-6 lg:grid-cols-3">
            <AnalyticsStatusOverview employees={metrics.employees} />
            <AnalyticsPerformanceOverview performance={metrics.performance} />
            <AnalyticsConversationTimeDonut
              employees={data.topEmployees}
              totalConversationSeconds={
                metrics.sessions.totalConversationSeconds
              }
            />
          </section>
        </TabsContent>

        <TabsContent value="knowledge" className="flex flex-col gap-6">
          <section className="grid gap-6 lg:grid-cols-2">
            <AnalyticsKnowledgeOverview knowledge={metrics.knowledge} />
            <AnalyticsLifecycleOverview activity={metrics.activity} />
          </section>
          <section>
            <AnalyticsRecentLifecycle events={data.recentLifecycle} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
