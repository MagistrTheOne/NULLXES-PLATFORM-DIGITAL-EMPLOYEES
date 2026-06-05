"use client";

import { useTranslations } from "next-intl";
import type { KnowledgeMetrics } from "../types";
import { AnalyticsCard } from "./analytics-card";

function MetricBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const widthPercent = max > 0 ? Math.max(4, (value / max) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/75"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsKnowledgeOverview({
  knowledge,
}: {
  knowledge: KnowledgeMetrics;
}) {
  const t = useTranslations("analytics.overview");
  const maxValue = Math.max(
    knowledge.readySources,
    knowledge.processingSources,
    knowledge.failedSources,
    1,
  );

  return (
    <AnalyticsCard title={t("knowledge")}>
      <div className="space-y-5 px-5 py-5">
        <MetricBar label={t("ready")} value={knowledge.readySources} max={maxValue} />
        <MetricBar
          label={t("processing")}
          value={knowledge.processingSources}
          max={maxValue}
        />
        <MetricBar label={t("failed")} value={knowledge.failedSources} max={maxValue} />
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          {t("sourcesChunks", {
            sources: knowledge.totalSources,
            chunks: knowledge.totalChunks,
          })}
        </p>
      </div>
    </AnalyticsCard>
  );
}
