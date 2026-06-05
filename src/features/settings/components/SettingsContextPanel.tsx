"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
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
  trendLabel,
}: {
  label: string;
  value: string;
  trend: string | null;
  trendLabel: (trend: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-medium tabular-nums text-foreground">{value}</p>
      {trend ? (
        <p className="mt-1 text-xs text-muted-foreground">{trendLabel(trend)}</p>
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
  const t = useTranslations("settings.context");
  const chunkLimit = 32_000;
  const chunkPercent =
    chunkLimit > 0
      ? Math.min(100, Math.round((context.totalChunks / chunkLimit) * 1000) / 10)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard title={t("orgSummary")}>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("plan")}</dt>
            <dd className="capitalize text-foreground">{organization.type}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("members")}</dt>
            <dd className="tabular-nums text-foreground">{context.memberCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("digitalEmployees")}</dt>
            <dd className="tabular-nums text-foreground">{context.employeeCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("activeNow")}</dt>
            <dd className="tabular-nums text-foreground">{context.activeNow}</dd>
          </div>
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t("indexedChunks")}</dt>
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
            <dt className="text-muted-foreground">{t("created")}</dt>
            <dd className="text-foreground">
              {format(organization.createdAt, "MMM d, yyyy")}
            </dd>
          </div>
        </dl>
      </SettingsCard>

      <SettingsCard title={t("usageOverview")} description={t("usageOverviewDesc")}>
        <div className="grid grid-cols-2 gap-3">
          <UsageMetric
            label={t("sessions")}
            value={String(context.usage.totalSessions)}
            trend={formatTrend(context.usage.sessionTrendPercent)}
            trendLabel={(trend) => t("trendVsPrevious", { trend })}
          />
          <UsageMetric
            label={t("talkTime")}
            value={formatDurationSeconds(context.usage.totalConversationSeconds)}
            trend={formatTrend(context.usage.conversationTrendPercent)}
            trendLabel={(trend) => t("trendVsPrevious", { trend })}
          />
          <UsageMetric
            label={t("messages")}
            value={context.usage.totalMessages.toLocaleString()}
            trend={formatTrend(context.usage.messagesTrendPercent)}
            trendLabel={(trend) => t("trendVsPrevious", { trend })}
          />
          <UsageMetric
            label={t("knowledgeSources")}
            value={String(context.usage.totalKnowledgeSources)}
            trend={formatTrend(context.usage.knowledgeTrendPercent)}
            trendLabel={(trend) => t("trendVsPrevious", { trend })}
          />
        </div>
      </SettingsCard>

      <SettingsCard title={t("teamMembers")}>
        <ul className="space-y-3">
          {context.teamMembers.length === 0 ? (
            <li className="text-sm text-muted-foreground">{t("noTeamMembers")}</li>
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
