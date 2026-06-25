"use client";

import { useTranslations } from "next-intl";
import type { HqDepartmentMetrics } from "../types";

function MetricCard({ metrics }: { metrics: HqDepartmentMetrics }) {
  const tDepartments = useTranslations("hq.departments");
  const t = useTranslations("hq.metrics");
  const hasEmployees = metrics.total > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="truncate text-[11px] tracking-[0.12em] text-white/45 uppercase">
        {tDepartments(metrics.department)}
      </p>
      <p className="mt-2 text-2xl font-medium tabular-nums text-white">
        {hasEmployees ? `${metrics.utilization}%` : "—"}
      </p>
      <p className="mt-1 text-[11px] text-white/40">
        {t("active", { count: metrics.active })}
      </p>
      <div className="mt-3 h-px w-full bg-white/10">
        <div
          className="h-px bg-white/60"
          style={{ width: `${metrics.utilization}%` }}
        />
      </div>
    </div>
  );
}

export function HqMetricsStrip({
  metrics,
}: {
  metrics: HqDepartmentMetrics[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map((item) => (
        <MetricCard key={item.department} metrics={item} />
      ))}
    </div>
  );
}
