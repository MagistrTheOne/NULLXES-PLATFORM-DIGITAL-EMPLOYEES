"use client";

import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDurationSeconds } from "../lib/format-duration";
import type { TopEmployeeRow } from "../types";
import { AnalyticsCard } from "./analytics-card";

const SLICE_COLORS = [
  "rgba(255,255,255,0.92)",
  "rgba(255,255,255,0.72)",
  "rgba(255,255,255,0.52)",
  "rgba(255,255,255,0.36)",
  "rgba(255,255,255,0.24)",
  "rgba(255,255,255,0.16)",
  "rgba(255,255,255,0.12)",
  "rgba(255,255,255,0.08)",
];

export function AnalyticsConversationTimeDonut({
  employees,
  totalConversationSeconds,
}: {
  employees: TopEmployeeRow[];
  totalConversationSeconds: number;
}) {
  const t = useTranslations("analytics.charts");
  const slices = employees
    .filter((employee) => employee.totalDurationSeconds > 0)
    .slice(0, 8)
    .map((employee) => ({
      name: employee.name,
      value: employee.totalDurationSeconds,
    }));

  const chartConfig = Object.fromEntries(
    slices.map((slice, index) => [
      `slice-${index}`,
      { label: slice.name, color: SLICE_COLORS[index % SLICE_COLORS.length] },
    ]),
  );

  return (
    <AnalyticsCard
      title={t("conversationTime")}
      description={t("conversationTimeDesc")}
      className="min-h-[280px]"
    >
      <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
        {slices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noConversationTime")}</p>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[180px] w-[180px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-border bg-card text-foreground"
                      formatter={(value) =>
                        formatDurationSeconds(Number(value ?? 0))
                      }
                    />
                  }
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth={1}
                >
                  {slices.map((slice, index) => (
                    <Cell
                      key={slice.name}
                      fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-2xl font-medium tabular-nums text-foreground">
                {formatDurationSeconds(totalConversationSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">{t("totalConversationTime")}</p>
              <ul className="space-y-1.5 pt-2">
                {slices.map((slice) => (
                  <li
                    key={slice.name}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="truncate text-muted-foreground">{slice.name}</span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      {formatDurationSeconds(slice.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </AnalyticsCard>
  );
}
