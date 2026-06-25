"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreateEmployeeDialog } from "@/features/employees/create";
import { revalidateEmployeePaths } from "@/features/employees/actions/revalidate-employee-paths";
import type { DashboardOverview } from "../types";
import { OverviewEmployeeCarousel } from "./OverviewEmployeeCarousel";
import { OverviewHeader } from "./OverviewHeader";
import { OverviewMetricsStrip } from "./overview-metrics-strip";
import { OverviewSecondaryPanels } from "./overview-secondary-panels";

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
      <div className="flex w-full flex-col gap-5">
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

        <OverviewEmployeeCarousel
          employees={data.employees}
          onCreateClick={() => setCreateDialogOpen(true)}
        />

        <OverviewMetricsStrip metrics={metrics} />

        <OverviewSecondaryPanels
          recentActivity={data.recentActivity}
          liveSessions={data.liveSessions}
          overnightWork={data.overnightWork}
        />
      </div>

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onComplete={handleCreateComplete}
      />
    </>
  );
}
