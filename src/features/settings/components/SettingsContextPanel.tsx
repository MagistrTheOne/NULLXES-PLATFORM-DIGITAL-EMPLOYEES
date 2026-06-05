import { format } from "date-fns";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import type { OrganizationProfileDto, SettingsContextPanel as ContextPanel } from "../types";
import { SettingsCard } from "./settings-card";

function formatTrend(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function UsageMetric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-medium tabular-nums text-foreground">{value}</p>
      {trend ? (
        <p className="mt-1 text-xs text-muted-foreground">{trend} vs previous period</p>
      ) : null}
    </div>
  );
}

export function SettingsContextPanel({
  organization,
  context,
}: {
  organization: OrganizationProfileDto;
  context: ContextPanel;
}) {
  const chunkLimit = 32_000;
  const chunkPercent =
    chunkLimit > 0
      ? Math.min(100, Math.round((context.totalChunks / chunkLimit) * 1000) / 10)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard title="Organization Summary">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="capitalize text-foreground">{organization.type}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Members</dt>
            <dd className="tabular-nums text-foreground">{context.memberCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Digital Employees</dt>
            <dd className="tabular-nums text-foreground">{context.employeeCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Active Now</dt>
            <dd className="tabular-nums text-foreground">{context.activeNow}</dd>
          </div>
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Indexed chunks</dt>
              <dd className="tabular-nums text-foreground">
                {context.totalChunks.toLocaleString()} / {chunkLimit.toLocaleString()}
              </dd>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-white/55"
                style={{ width: `${Math.max(chunkPercent, context.totalChunks > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-foreground">
              {format(organization.createdAt, "MMM d, yyyy")}
            </dd>
          </div>
        </dl>
      </SettingsCard>

      <SettingsCard title="Usage Overview" description="Selected analytics period">
        <div className="grid grid-cols-2 gap-3">
          <UsageMetric
            label="Sessions"
            value={String(context.usage.totalSessions)}
            trend={formatTrend(context.usage.sessionTrendPercent)}
          />
          <UsageMetric
            label="Talk Time"
            value={formatDurationSeconds(context.usage.totalConversationSeconds)}
            trend={formatTrend(context.usage.conversationTrendPercent)}
          />
          <UsageMetric
            label="Messages"
            value={context.usage.totalMessages.toLocaleString()}
            trend={formatTrend(context.usage.messagesTrendPercent)}
          />
          <UsageMetric
            label="Knowledge Sources"
            value={String(context.usage.totalKnowledgeSources)}
            trend={formatTrend(context.usage.knowledgeTrendPercent)}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Team Members">
        <ul className="space-y-3">
          {context.teamMembers.length === 0 ? (
            <li className="text-sm text-muted-foreground">No team members found.</li>
          ) : (
            context.teamMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
                <span className="shrink-0 text-xs capitalize text-muted-foreground">
                  {member.role}
                </span>
              </li>
            ))
          )}
        </ul>
      </SettingsCard>
    </div>
  );
}
