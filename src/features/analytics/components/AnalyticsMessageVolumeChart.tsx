"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { MessageTimeseriesPoint } from "../types";
import { AnalyticsCard } from "./analytics-card";

const chartConfig = {
  messages: {
    label: "Messages",
    color: "#ffffff",
  },
} as const;

function formatAxisDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsMessageVolumeChart({
  timeseries,
}: {
  timeseries: MessageTimeseriesPoint[];
}) {
  const totalMessages = timeseries.reduce((sum, point) => sum + point.messages, 0);

  return (
    <AnalyticsCard title="Message Volume" className="min-h-[320px]">
      <div className="flex h-[260px] flex-col px-4 py-4">
        {totalMessages === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            No messages recorded in this period.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={timeseries}
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
                allowDecimals={false}
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
                  />
                }
              />
              <Bar
                dataKey="messages"
                fill="var(--color-messages)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </AnalyticsCard>
  );
}
