"use client";

import { useRouter } from "next/navigation";
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
import { OverviewRecentActivity } from "./OverviewRecentActivity";
import { OverviewSystemStatus } from "./OverviewSystemStatus";

export function OverviewScreen({ data }: { data: DashboardOverview }) {
  const router = useRouter();
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
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage and operate your digital workforce.
            </p>
          </div>
          <OverviewHeader
            range={data.range}
            onCreateClick={() => setCreateDialogOpen(true)}
          />
        </header>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <AnalyticsKpiCard
            title="Total Employees"
            value={String(metrics.employees.total)}
            detail={`${metrics.employees.active} active`}
            trend={metrics.trends.employees}
          />
          <AnalyticsKpiCard
            title="Active Now"
            value={String(metrics.activeNow)}
            detail={
              metrics.activeNow > 0
                ? "In conversations"
                : "No live conversations"
            }
          />
          <AnalyticsKpiCard
            title="Total Sessions"
            value={String(metrics.sessions.totalSessions)}
            detail={`${metrics.sessions.completedSessions} completed`}
            trend={metrics.trends.sessions}
          />
          <AnalyticsKpiCard
            title="Total Talk Time"
            value={formatDurationSeconds(metrics.sessions.totalConversationSeconds)}
            detail={
              metrics.sessions.completedSessions > 0
                ? `Avg ${formatDurationSeconds(metrics.sessions.averageSessionDurationSeconds)}`
                : "No completed sessions yet"
            }
            trend={metrics.trends.conversationSeconds}
          />
          <AnalyticsKpiCard
            title="Satisfaction"
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

        <OverviewEmployeeCarousel
          employees={data.employees}
          onCreateClick={() => setCreateDialogOpen(true)}
        />

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <OverviewRecentActivity events={data.recentActivity} />
          </div>
          <div className="xl:col-span-8">
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
