"use client";

import { useTranslations } from "next-intl";
import type { EmployeeMetrics } from "../types";
import { AnalyticsCard } from "./analytics-card";

function StatusRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const widthPercent = max > 0 ? Math.max(4, (value / max) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsStatusOverview({
  employees,
}: {
  employees: EmployeeMetrics;
}) {
  const t = useTranslations("analytics.overview");
  const maxValue = Math.max(
    employees.activeEmployees,
    employees.draftEmployees,
    employees.pausedEmployees,
    employees.archivedEmployees,
    1,
  );

  return (
    <AnalyticsCard title={t("employeeStatus")}>
      <div className="space-y-5 px-5 py-5">
        <StatusRow label={t("active")} value={employees.activeEmployees} max={maxValue} />
        <StatusRow label={t("draft")} value={employees.draftEmployees} max={maxValue} />
        <StatusRow label={t("paused")} value={employees.pausedEmployees} max={maxValue} />
        <StatusRow
          label={t("archived")}
          value={employees.archivedEmployees}
          max={maxValue}
        />
      </div>
    </AnalyticsCard>
  );
}
