"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { SessionTimeseriesPoint } from "../types";

const chartConfig = {
  sessions: {
    label: "Sessions",
    color: "#ffffff",
  },
} as const;

function formatAxisDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsSessionTrendChart({
  timeseries,
}: {
  timeseries: SessionTimeseriesPoint[];
}) {
  const totalSessions = timeseries.reduce((sum, point) => sum + point.sessions, 0);

  if (totalSessions === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-white/10 bg-[#111111] px-6 text-sm text-white/45">
        No sessions recorded in the last 30 days.
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[280px] w-full rounded-xl border border-white/10 bg-[#111111] px-2 pt-4"
    >
      <LineChart data={timeseries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
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
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="rgba(255,255,255,0.35)"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="border-white/12 bg-[#0a0a0a] text-white"
              labelFormatter={(value) => formatAxisDate(String(value))}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="sessions"
          stroke="var(--color-sessions)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
