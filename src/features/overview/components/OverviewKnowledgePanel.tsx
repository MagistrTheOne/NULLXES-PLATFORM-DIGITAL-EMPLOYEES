import type { KnowledgeMetrics } from "@/features/analytics/types";
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
    <OverviewCard title="Knowledge Overview">
      <div className="space-y-5 px-5 py-5">
        <MetricBar label="Ready" value={knowledge.readySources} max={maxValue} />
        <MetricBar
          label="Processing"
          value={knowledge.processingSources}
          max={maxValue}
        />
        <MetricBar label="Failed" value={knowledge.failedSources} max={maxValue} />
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Indexed chunks</span>
            <span className="tabular-nums text-foreground">
              {knowledge.totalChunks.toLocaleString()} / {chunkLimit.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-white/55"
              style={{ width: `${Math.max(chunkUsagePercent, knowledge.totalChunks > 0 ? 4 : 0)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {knowledge.totalSources} sources indexed
          </p>
        </div>
      </div>
    </OverviewCard>
  );
}
