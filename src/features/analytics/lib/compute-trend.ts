import type { MetricTrend } from "../types";

export function computeTrend(value: number, previousValue: number): MetricTrend {
  if (previousValue === 0) {
    return {
      value,
      previousValue,
      changePercent: value > 0 ? 100 : null,
    };
  }

  return {
    value,
    previousValue,
    changePercent: Math.round(((value - previousValue) / previousValue) * 100),
  };
}
