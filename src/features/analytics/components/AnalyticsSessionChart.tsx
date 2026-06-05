"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { SessionTimeseriesPoint } from "../types";
import { AnalyticsCard } from "./analytics-card";

function formatAxisDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsSessionChart({
  timeseries,
}: {
  timeseries: SessionTimeseriesPoint[];
}) {
  const t = useTranslations("analytics.charts");
  const chartConfig = useMemo(
    () =>
      ({
        sessions: { label: t("sessions"), color: "#ffffff" },
        previousSessions: {
          label: t("previousPeriod"),
          color: "rgba(255,255,255,0.35)",
        },
      }) as const,
    [t],
  );
  const totalSessions = timeseries.reduce((sum, point) => sum + point.sessions, 0);

  return (
    <AnalyticsCard title={t("sessionsOverTime")} className="h-[420px]">
      <div className="flex h-[calc(420px-57px)] flex-col px-4 py-4">
        {totalSessions === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {t("noSessionsInPeriod")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart
              data={timeseries}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
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
              <Line
                type="monotone"
                dataKey="previousSessions"
                stroke="var(--color-previousSessions)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
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
        )}
      </div>
    </AnalyticsCard>
  );
}
