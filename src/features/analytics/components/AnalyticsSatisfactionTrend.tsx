"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { SatisfactionTimeseriesPoint } from "../types";
import { AnalyticsCard } from "./analytics-card";

const chartConfig = {
  averageRating: {
    label: "Satisfaction",
    color: "#ffffff",
  },
} as const;

function formatAxisDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsSatisfactionTrend({
  timeseries,
}: {
  timeseries: SatisfactionTimeseriesPoint[];
}) {
  const ratedDays = timeseries.filter((point) => point.ratedSessions > 0);
  const chartData = timeseries.map((point) => ({
    ...point,
    averageRating: point.averageRating ?? 0,
  }));

  return (
    <AnalyticsCard title="User Satisfaction Trend" className="min-h-[320px]">
      <div className="flex h-[260px] flex-col px-4 py-4">
        {ratedDays.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            No satisfaction ratings in this period.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart
              data={chartData}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={formatAxisDate}
                stroke="rgba(255,255,255,0.35)"
              />
              <YAxis
                domain={[1, 5]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="rgba(255,255,255,0.35)"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="border-border bg-card text-foreground"
                    labelFormatter={(value) => formatAxisDate(String(value))}
                    formatter={(value) => `${Number(value).toFixed(1)} / 5`}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="averageRating"
                stroke="var(--color-averageRating)"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </AnalyticsCard>
  );
}
