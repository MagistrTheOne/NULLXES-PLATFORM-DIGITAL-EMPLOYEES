"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Radio, Users } from "lucide-react";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { cn } from "@/lib/utils";
import type { OverviewMetrics } from "../types";

function MetricItem({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 px-4 py-3.5 sm:px-5">
      {icon}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        {detail ? (
          <span className="truncate text-xs text-muted-foreground">{detail}</span>
        ) : null}
      </div>
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
    <section className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-card-foreground sm:grid-cols-3 xl:grid-cols-5 xl:divide-y-0">
      <MetricItem
        label={t("metrics.workforce")}
        value={String(metrics.employees.total)}
        detail={t("kpi.active", { count: metrics.employees.active })}
        icon={
          <Users className="mt-0.5 size-4 shrink-0 stroke-[1.5] text-muted-foreground" />
        }
      />

      <MetricItem
        label={t("metrics.activeNow")}
        value={String(metrics.activeNow)}
        detail={
          metrics.activeNow > 0
            ? t("kpi.inConversations")
            : t("kpi.noLiveConversations")
        }
        icon={
          <Radio
            className={cn(
              "mt-0.5 size-4 shrink-0 stroke-[1.5]",
              metrics.activeNow > 0
                ? "text-foreground"
                : "text-muted-foreground opacity-60",
            )}
          />
        }
      />

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
