import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KnowledgeMetrics } from "../types";

function KnowledgeStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
      <p className="text-xs tracking-wide text-white/45 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-medium tabular-nums text-white">{value}</p>
    </div>
  );
}

export function AnalyticsKnowledgeOverview({
  knowledge,
}: {
  knowledge: KnowledgeMetrics;
}) {
  const pendingSources =
    knowledge.totalSources -
    knowledge.readySources -
    knowledge.processingSources -
    knowledge.failedSources;

  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="border-b border-white/10 px-5 py-4">
        <CardTitle className="text-base font-medium">Knowledge Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-5 py-5 sm:grid-cols-2">
        <KnowledgeStat label="Ready" value={knowledge.readySources} />
        <KnowledgeStat label="Processing" value={knowledge.processingSources} />
        <KnowledgeStat label="Failed" value={knowledge.failedSources} />
        <KnowledgeStat label="Pending" value={Math.max(0, pendingSources)} />
      </CardContent>
    </Card>
  );
}
