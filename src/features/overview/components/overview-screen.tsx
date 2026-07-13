"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreateEmployeeDialog } from "@/features/employees/create";
import { EmployeeCreateUpgradeDialog } from "@/features/employees/components/employee-create-upgrade-dialog";
import { useEmployeeCreateEligibility } from "@/features/employees/lib/use-employee-create-eligibility";
import { revalidateEmployeePaths } from "@/features/employees/actions/revalidate-employee-paths";
import type { DashboardOverview } from "../types";
import { OverviewEmployeeCarousel } from "./OverviewEmployeeCarousel";
import { OverviewHeader } from "./OverviewHeader";
import { OverviewMetricsStrip } from "./overview-metrics-strip";
import { OverviewSecondaryPanels } from "./overview-secondary-panels";
import { ScenarioPostCreateSheet } from "@/features/scenarios/components/scenario-post-create-sheet";

export function OverviewScreen({ data }: { data: DashboardOverview }) {
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [postCreateScenario, setPostCreateScenario] = useState<{
    employeeId: string;
    name: string;
  } | null>(null);
  const { isAtEmployeeLimit, canCreateEmployee } = useEmployeeCreateEligibility(
    data.employees,
  );
  const { metrics } = data;

  function handleCreateClick(): void {
    if (!canCreateEmployee || isAtEmployeeLimit) {
      setUpgradeDialogOpen(true);
      return;
    }

    setCreateDialogOpen(true);
  }

  async function handleCreateComplete({
    employeeId,
    name,
  }: {
    employeeId: string;
    avatarProvisionStarted: boolean;
    name: string;
    role: string;
    portraitPreviewUrl: string;
  }): Promise<void> {
    setPostCreateScenario({ employeeId, name });
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
      <div className="flex w-full min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {tCommon("subtitle.workforce")}
            </p>
          </div>
          <OverviewHeader
            range={data.range}
            onCreateClick={handleCreateClick}
            canCreate={canCreateEmployee}
          />
        </header>

        <OverviewEmployeeCarousel
          employees={data.employees}
          onCreateClick={handleCreateClick}
          canCreate={canCreateEmployee}
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

      <EmployeeCreateUpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        reason="employee_limit"
      />

      {postCreateScenario ? (
        <ScenarioPostCreateSheet
          open
          employeeId={postCreateScenario.employeeId}
          employeeName={postCreateScenario.name}
          onOpenChange={(open) => {
            if (!open) {
              setPostCreateScenario(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
