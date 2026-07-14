"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import type { HqDepartmentMetrics } from "../types";

function MetricCard({ metrics }: { metrics: HqDepartmentMetrics }) {
  const tDepartments = useTranslations("hq.departments");
  const t = useTranslations("hq.metrics");
  const hasEmployees = metrics.total > 0;

  return (
    <Link
      href={`/dashboard/analytics?department=${metrics.department}`}
      aria-label={`${tDepartments(metrics.department)} — ${t("viewAnalytics")}`}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/2  p-4 transition-colors hover:border-white/20 hover:bg-white/4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[11px] tracking-[0.12em] text-white/45 uppercase">
          {tDepartments(metrics.department)}
        </p>
        <ArrowUpRight className="size-3.5 shrink-0 text-white/25 transition-colors group-hover:text-white/70" />
      </div>

      <p className="mt-2 text-2xl font-medium tabular-nums text-white">
        {hasEmployees ? metrics.sessions.toLocaleString() : "—"}
      </p>
      <p className="text-[11px] text-white/40">{t("sessions")}</p>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
        <span className="tabular-nums">
          {metrics.satisfactionAvg !== null
            ? `${t("satisfaction")} ${metrics.satisfactionAvg.toFixed(1)}`
            : `${t("satisfaction")} —`}
        </span>
        <span className="text-white/20">·</span>
        <span className="tabular-nums">
          {formatDurationSeconds(metrics.conversationSeconds)}
        </span>
      </div>

      <div className="mt-3 h-px w-full bg-white/10">
        <div
          className="h-px bg-white/60"
          style={{ width: `${metrics.utilization}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-white/35">
        {t("occupancy", {
          occupied: metrics.total,
          capacity: metrics.capacity,
        })}
      </p>
    </Link>
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
