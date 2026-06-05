import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDurationSeconds } from "../lib/format-duration";
import type { WorkspaceAnalytics } from "../types";

function KpiCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="px-5 py-4">
        <CardTitle className="text-sm font-medium text-white/55">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <p className="text-3xl font-medium tracking-tight tabular-nums">{value}</p>
        {detail ? (
          <p className="mt-2 text-xs text-white/45">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AnalyticsKpiRow({ metrics }: { metrics: WorkspaceAnalytics }) {
  const { employees, sessions, knowledge } = metrics;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Employees"
        value={String(employees.totalEmployees)}
        detail={`${employees.activeEmployees} active · ${employees.draftEmployees} draft`}
      />
      <KpiCard
        title="Sessions"
        value={String(sessions.totalSessions)}
        detail={`${sessions.completedSessions} completed`}
      />
      <KpiCard
        title="Conversation Time"
        value={formatDurationSeconds(sessions.totalConversationSeconds)}
        detail={
          sessions.completedSessions > 0
            ? `Avg ${formatDurationSeconds(sessions.averageSessionDurationSeconds)}`
            : "No completed sessions yet"
        }
      />
      <KpiCard
        title="Knowledge Sources"
        value={String(knowledge.totalSources)}
        detail={`${knowledge.totalChunks} chunks indexed`}
      />
    </div>
  );
}
