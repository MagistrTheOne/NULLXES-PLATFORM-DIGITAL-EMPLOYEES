import type { MetricTrend } from "../types";

export function formatTrendLabel(trend: MetricTrend | null | undefined): string | null {
  if (!trend || trend.changePercent === null) {
    return null;
  }

  const sign = trend.changePercent > 0 ? "+" : "";
  return `${sign}${trend.changePercent}%`;
}
