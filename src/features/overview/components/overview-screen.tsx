"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AnalyticsKpiCard } from "@/features/analytics/components/AnalyticsKpiCard";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { CreateEmployeeDialog } from "@/features/employees/create";
import { revalidateEmployeePaths } from "@/features/employees/actions/revalidate-employee-paths";
import type { DashboardOverview } from "../types";
import { OverviewEmployeeCarousel } from "./OverviewEmployeeCarousel";
import { OverviewHeader } from "./OverviewHeader";
import { OverviewKnowledgePanel } from "./OverviewKnowledgePanel";
import { OverviewLiveSessions } from "./OverviewLiveSessions";
import { OverviewOvernightWork } from "./OverviewOvernightWork";
import { OverviewRecentActivity } from "./OverviewRecentActivity";
import { OverviewSystemStatus } from "./OverviewSystemStatus";

export function OverviewScreen({ data }: { data: DashboardOverview }) {
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { metrics } = data;

  async function handleCreateComplete({
    employeeId,
  }: {
    employeeId: string;
    avatarProvisionStarted: boolean;
  }): Promise<void> {
    router.refresh();

    const refreshDelaysMs = [8000, 30000, 90000];
    for (const delayMs of refreshDelaysMs) {
      window.setTimeout(() => {
        void revalidateEmployeePaths(employeeId).then(() => router.refresh());
      }, delayMs);
    }
  }

  return (
    <>
      <div className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {tCommon("subtitle.workforce")}
            </p>
          </div>
          <OverviewHeader
            range={data.range}
            onCreateClick={() => setCreateDialogOpen(true)}
          />
        </header>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <AnalyticsKpiCard
            title={t("kpi.totalEmployees")}
            value={String(metrics.employees.total)}
            detail={t("kpi.active", { count: metrics.employees.active })}
            trend={metrics.trends.employees}
          />
          <AnalyticsKpiCard
            title={t("kpi.activeNow")}
            value={String(metrics.activeNow)}
            detail={
              metrics.activeNow > 0
                ? t("kpi.inConversations")
                : t("kpi.noLiveConversations")
            }
          />
          <AnalyticsKpiCard
            title={t("kpi.totalSessions")}
            value={String(metrics.sessions.totalSessions)}
            detail={t("kpi.completed", {
              count: metrics.sessions.completedSessions,
            })}
            trend={metrics.trends.sessions}
          />
          <AnalyticsKpiCard
            title={t("kpi.totalTalkTime")}
            value={formatDurationSeconds(metrics.sessions.totalConversationSeconds)}
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
          />
          <AnalyticsKpiCard
            title={t("kpi.satisfaction")}
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
          />
        </section>

        <OverviewEmployeeCarousel
          employees={data.employees}
          onCreateClick={() => setCreateDialogOpen(true)}
        />

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <OverviewRecentActivity events={data.recentActivity} />
          </div>
          <div className="xl:col-span-4">
            <OverviewOvernightWork events={data.overnightWork} />
          </div>
          <div className="xl:col-span-4">
            <OverviewLiveSessions sessions={data.liveSessions} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <OverviewKnowledgePanel knowledge={metrics.knowledge} />
          <OverviewSystemStatus items={data.systemStatus} />
        </section>
      </div>

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onComplete={handleCreateComplete}
      />
    </>
  );
}
