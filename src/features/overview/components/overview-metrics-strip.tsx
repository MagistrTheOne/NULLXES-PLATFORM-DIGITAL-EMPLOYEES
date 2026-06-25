"use client";

import { useTranslations } from "next-intl";
import { Radio, Users } from "lucide-react";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { cn } from "@/lib/utils";
import type { OverviewMetrics } from "../types";

function MetricItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 px-5 py-3">
      <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-lg font-medium tabular-nums text-foreground">
        {value}
      </span>
      {detail ? (
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      ) : null}
    </div>
  );
}

export function OverviewMetricsStrip({
  metrics,
}: {
  metrics: OverviewMetrics;
}) {
  const t = useTranslations("dashboard");

  const satisfaction =
    metrics.conversation.averageSatisfaction !== null
      ? `${metrics.conversation.averageSatisfaction.toFixed(1)} / 5`
      : "—";

  return (
    <section className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-card-foreground sm:grid-cols-3 sm:divide-y-0 xl:grid-cols-5">
      <div className="relative flex items-center gap-3 px-5 py-3">
        <Users className="size-4 shrink-0 stroke-[1.5] text-muted-foreground" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {t("metrics.workforce")}
          </span>
          <span className="text-lg font-medium tabular-nums text-foreground">
            {metrics.employees.total}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {t("kpi.active", { count: metrics.employees.active })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 py-3">
        <Radio
          className={cn(
            "size-4 shrink-0 stroke-[1.5]",
            metrics.activeNow > 0 ? "text-foreground" : "text-muted-foreground opacity-60",
          )}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {t("metrics.activeNow")}
          </span>
          <span className="text-lg font-medium tabular-nums text-foreground">
            {metrics.activeNow}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {metrics.activeNow > 0
              ? t("kpi.inConversations")
              : t("kpi.noLiveConversations")}
          </span>
        </div>
      </div>

      <MetricItem
        label={t("metrics.sessions")}
        value={String(metrics.sessions.totalSessions)}
        detail={t("kpi.completed", {
          count: metrics.sessions.completedSessions,
        })}
      />

      <MetricItem
        label={t("metrics.talkTime")}
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
      />

      <MetricItem
        label={t("metrics.satisfaction")}
        value={satisfaction}
        detail={
          metrics.conversation.ratedSessions > 0
            ? t("kpi.ratings", { count: metrics.conversation.ratedSessions })
            : t("kpi.noRatings")
        }
      />
    </section>
  );
}
