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
  const metrics = [
    {
      label: "Response Time",
      value: formatResponseTime(performance.averageFirstResponseMs),
      detail: "Average first response",
    },
    {
      label: "Resolution Rate",
      value:
        performance.completedSessions > 0
          ? `${performance.resolutionRatePercent}%`
          : "—",
      detail: "Completed sessions resolved",
    },
    {
      label: "Escalation Rate",
      value:
        performance.completedSessions > 0 || performance.escalationRatePercent > 0
          ? `${performance.escalationRatePercent}%`
          : "—",
      detail: "Sessions escalated to human",
    },
  ];

  return (
    <AnalyticsCard title="Performance Overview" className="min-h-[320px]">
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
