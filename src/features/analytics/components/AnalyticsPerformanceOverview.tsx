"use client";

import { useTranslations } from "next-intl";
import type { PerformanceMetrics } from "../types";
import { AnalyticsCard } from "./analytics-card";

function formatResponseTime(ms: number): string {
  if (ms <= 0) {
    return "—";
  }

  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

export function AnalyticsPerformanceOverview({
  performance,
}: {
  performance: PerformanceMetrics;
}) {
  const t = useTranslations("analytics.performance");
  const metrics = [
    {
      label: t("responseTime"),
      value: formatResponseTime(performance.averageFirstResponseMs),
      detail: t("responseTimeDetail"),
    },
    {
      label: t("resolutionRate"),
      value:
        performance.completedSessions > 0
          ? `${performance.resolutionRatePercent}%`
          : "—",
      detail: t("resolutionRateDetail"),
    },
    {
      label: t("escalationRate"),
      value:
        performance.completedSessions > 0 || performance.escalationRatePercent > 0
          ? `${performance.escalationRatePercent}%`
          : "—",
      detail: t("escalationRateDetail"),
    },
  ];

  return (
    <AnalyticsCard title={t("title")} className="min-h-[320px]">
      <div className="grid gap-4 px-5 py-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border bg-background/40 px-4 py-4"
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-2xl font-medium tabular-nums text-foreground">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}
