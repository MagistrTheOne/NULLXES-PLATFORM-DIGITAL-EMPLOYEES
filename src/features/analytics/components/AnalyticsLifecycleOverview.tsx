"use client";

import { useTranslations } from "next-intl";
import type { ActivityMetrics } from "../types";
import { AnalyticsCard } from "./analytics-card";

function ActivityStat({
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

export function AnalyticsLifecycleOverview({
  activity,
}: {
  activity: ActivityMetrics;
}) {
  const t = useTranslations("analytics.overview");
  const maxValue = Math.max(
    activity.createdEmployeesLast7Days,
    activity.activatedEmployeesLast7Days,
    activity.archivedEmployeesLast7Days,
    1,
  );

  return (
    <AnalyticsCard title={t("lifecycle")} description={t("lifecycleDesc")}>
      <div className="space-y-5 px-5 py-5">
        <ActivityStat
          label={t("created")}
          value={activity.createdEmployeesLast7Days}
          max={maxValue}
        />
        <ActivityStat
          label={t("activated")}
          value={activity.activatedEmployeesLast7Days}
          max={maxValue}
        />
        <ActivityStat
          label={t("archived")}
          value={activity.archivedEmployeesLast7Days}
          max={maxValue}
        />
      </div>
    </AnalyticsCard>
  );
}
