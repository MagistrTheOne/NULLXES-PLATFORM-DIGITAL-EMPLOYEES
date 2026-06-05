import { cn } from "@/lib/utils";
import type { MetricTrend } from "../types";
import { formatTrendLabel } from "../lib/format-trend";

export function AnalyticsKpiCard({
  title,
  value,
  detail,
  trend,
  className,
}: {
  title: string;
  value: string;
  detail: string;
  trend?: MetricTrend | null;
  className?: string;
}) {
  const trendLabel = formatTrendLabel(trend);

  return (
    <article
      className={cn(
        "flex min-h-[132px] flex-col justify-between rounded-2xl border border-border bg-card px-5 py-4 text-card-foreground",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        {trendLabel ? (
          <span className="shrink-0 text-xs tabular-nums text-foreground/80">
            {trendLabel}
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-medium tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}
