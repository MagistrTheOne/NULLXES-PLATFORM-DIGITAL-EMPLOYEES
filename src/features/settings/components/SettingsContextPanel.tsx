"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BILLING_PLANS } from "@/features/billing/config/plans";
import { getKnowledgeChunkLimitForPlan } from "@/features/billing/lib/knowledge-chunk-limit";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { formatOrganizationDate } from "@/shared/i18n/format-organization-date";
import { formatNumber } from "@/shared/i18n/format-number";
import { cn } from "@/lib/utils";
import type { OrganizationProfileDto, SettingsContextPanel as ContextPanel } from "../types";
import { SettingsCard } from "./settings-card";

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/30 px-2.5 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function formatTrend(value: number | null): string | null {
  if (value === null) {
    return null;
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function SettingsContextPanel({
  organization,
  context,
  dateFormat,
}: {
  organization: OrganizationProfileDto;
  context: ContextPanel;
  dateFormat: string;
}) {
  const t = useTranslations("settings.context");
  const locale = useLocale();
  const [usageOpen, setUsageOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const billingPlan = BILLING_PLANS[resolveBillingPlanId(organization.billingPlan)];
  const chunkLimit = getKnowledgeChunkLimitForPlan(billingPlan.id);
  const chunkPercent =
    chunkLimit && chunkLimit > 0
      ? Math.min(100, Math.round((context.totalChunks / chunkLimit) * 1000) / 10)
      : null;

  const usageSummary = [
    `${context.usage.totalSessions} ${t("sessions").toLowerCase()}`,
    `${formatNumber(context.usage.totalMessages, locale)} ${t("messages").toLowerCase()}`,
  ].join(" · ");

  const teamSummary =
    context.teamMembers.length === 0
      ? t("noTeamMembers")
      : context.teamMembers.length === 1
        ? context.teamMembers[0]!.name
        : `${context.teamMembers.length} ${t("members").toLowerCase()}`;

  return (
    <SettingsCard title={t("orgSummary")} className="xl:sticky xl:top-6">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <InlineMetric label={t("members")} value={String(context.memberCount)} />
          <InlineMetric
            label={t("digitalEmployees")}
            value={String(context.employeeCount)}
          />
          <InlineMetric label={t("activeNow")} value={String(context.activeNow)} />
        </div>

        <div className="space-y-2.5 border-t border-border pt-3">
          <SummaryRow
            label={t("plan")}
            value={
              <>
                {billingPlan.name}
                <span className="text-muted-foreground"> · {billingPlan.priceLabel}</span>
              </>
            }
          />
          <div className="space-y-1.5">
            <SummaryRow
              label={t("indexedChunks")}
              value={
                chunkLimit
                  ? `${formatNumber(context.totalChunks, locale)} / ${formatNumber(chunkLimit, locale)}`
                  : `${formatNumber(context.totalChunks, locale)} / ${t("unlimited")}`
              }
            />
            {chunkLimit ? (
            <div className="h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-white/55"
                style={{
                  width: `${Math.max(chunkPercent ?? 0, context.totalChunks > 0 ? 4 : 0)}%`,
                }}
              />
            </div>
            ) : null}
          </div>
          <SummaryRow
            label={t("created")}
            value={formatOrganizationDate(organization.createdAt, {
              dateFormat,
              locale,
            })}
          />
        </div>

        <Collapsible open={usageOpen} onOpenChange={setUsageOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/30 px-3 py-2.5 text-left transition-colors hover:bg-background/50">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{t("usageOverview")}</p>
              <p className="truncate text-[11px] text-muted-foreground">{usageSummary}</p>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                usageOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              <InlineMetric
                label={t("sessions")}
                value={String(context.usage.totalSessions)}
              />
              <InlineMetric
                label={t("talkTime")}
                value={formatDurationSeconds(context.usage.totalConversationSeconds)}
              />
              <InlineMetric
                label={t("messages")}
                value={formatNumber(context.usage.totalMessages, locale)}
              />
              <InlineMetric
                label={t("knowledgeSources")}
                value={String(context.usage.totalKnowledgeSources)}
              />
            </div>
            {formatTrend(context.usage.sessionTrendPercent) ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("trendVsPrevious", {
                  trend: formatTrend(context.usage.sessionTrendPercent)!,
                })}
              </p>
            ) : null}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={teamOpen} onOpenChange={setTeamOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/30 px-3 py-2.5 text-left transition-colors hover:bg-background/50">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{t("teamMembers")}</p>
              <p className="truncate text-[11px] text-muted-foreground">{teamSummary}</p>
            </div>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                teamOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ul className="space-y-1.5">
              {context.teamMembers.length === 0 ? (
                <li className="text-xs text-muted-foreground">{t("noTeamMembers")}</li>
              ) : (
                context.teamMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/30 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {member.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] capitalize text-muted-foreground">
                      {member.role}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </SettingsCard>
  );
}
