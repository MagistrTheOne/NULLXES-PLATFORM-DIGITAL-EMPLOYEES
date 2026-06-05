"use client";

import { useLocale, useTranslations } from "next-intl";
import type { KnowledgeMetrics } from "@/features/analytics/types";
import { formatNumber } from "@/shared/i18n/format-number";
import { OverviewCard } from "./overview-card";

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
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-white/70"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export function OverviewKnowledgePanel({
  knowledge,
}: {
  knowledge: KnowledgeMetrics;
}) {
  const t = useTranslations("dashboard.knowledge");
  const locale = useLocale();
  const maxValue = Math.max(
    knowledge.readySources,
    knowledge.processingSources,
    knowledge.failedSources,
    1,
  );
  const chunkLimit = 32_000;
  const chunkUsagePercent =
    chunkLimit > 0
      ? Math.min(100, Math.round((knowledge.totalChunks / chunkLimit) * 1000) / 10)
      : 0;

  return (
    <OverviewCard title={t("title")}>
      <div className="space-y-5 px-5 py-5">
        <MetricBar label={t("ready")} value={knowledge.readySources} max={maxValue} />
        <MetricBar
          label={t("processing")}
          value={knowledge.processingSources}
          max={maxValue}
        />
        <MetricBar label={t("failed")} value={knowledge.failedSources} max={maxValue} />
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t("indexedChunks")}</span>
            <span className="tabular-nums text-foreground">
              {formatNumber(knowledge.totalChunks, locale)} /{" "}
              {formatNumber(chunkLimit, locale)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-white/55"
              style={{ width: `${Math.max(chunkUsagePercent, knowledge.totalChunks > 0 ? 4 : 0)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("sourcesIndexed", { count: knowledge.totalSources })}
          </p>
        </div>
      </div>
    </OverviewCard>
  );
}
