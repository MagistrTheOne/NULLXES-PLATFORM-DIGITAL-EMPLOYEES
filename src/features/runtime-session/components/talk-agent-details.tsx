"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, UserRound } from "lucide-react";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { cn } from "@/lib/utils";
import type { TalkAgentPanelStats } from "../queries/get-talk-agent-panel";
import type { TalkActivityItem } from "../queries/get-talk-agent-activity";

export type TalkAgentDetails = {
  employeeId: string;
  name: string;
  role: string;
  avatarPreviewUrl: string | null;
  avatarReady: boolean;
  online: boolean;
  modelLabel: string | null;
  language: string;
  currentTaskTitle: string | null;
  xaiVoiceAvailable?: boolean;
  stats: TalkAgentPanelStats;
  activity?: TalkActivityItem[];
};

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">
      {children}
    </span>
  );
}

function StatRow({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "conversations";
}) {
  if (variant === "conversations") {
    return (
      <div className="conversations-detail-row grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-1.5 text-xs">
        <span className="text-white/45">{label}</span>
        <span className="max-w-[9.5rem] truncate text-right font-medium text-white/85">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 text-xs">
      <span className="text-white/45">{label}</span>
      <span className="truncate text-right font-medium text-white/85">
        {value}
      </span>
    </div>
  );
}

function formatActivityTime(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

const ACTIVITY_DOT: Record<
  NonNullable<TalkAgentDetails["activity"]>[number]["kind"],
  string
> = {
  connected: "bg-white/35",
  session_started: "bg-white/35",
  session_ended: "bg-white/25",
  speaking: "bg-emerald-400",
};

export function TalkAgentDetailsPanel({
  details,
  embedded = false,
  departmentLabel = null,
  showTitle = true,
  variant = "default",
}: {
  details: TalkAgentDetails;
  embedded?: boolean;
  departmentLabel?: string | null;
  showTitle?: boolean;
  variant?: "default" | "conversations";
}) {
  const t = useTranslations("employees.talk.agentPanel");
  const isConversations = variant === "conversations";

  return (
    <aside
      className={
        embedded
          ? cn(
              "flex h-full min-h-0 flex-col overflow-y-auto",
              isConversations ? "gap-4 p-4" : "gap-5 p-5",
            )
          : "flex h-full min-h-0 flex-col gap-5 overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0a] p-5"
      }
    >
      <div className={cn("flex flex-col", isConversations ? "gap-3" : "gap-4")}>
        {showTitle ? <SectionLabel>{t("title")}</SectionLabel> : null}
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black",
              showTitle && !isConversations ? "size-14 rounded-xl" : "size-12 rounded-full",
            )}
          >
            {details.avatarPreviewUrl && details.avatarReady ? (
              <AvatarIdlePreview
                src={details.avatarPreviewUrl}
                alt={details.name}
                sizes={isConversations ? "48px" : "56px"}
              />
            ) : (
              <UserRound className="size-6 stroke-[1.25] text-white/40" />
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-white">
              {details.name}
            </span>
            <span className="truncate text-xs text-white/45">
              {details.role}
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/70">
              <span
                className={
                  details.online
                    ? "size-1.5 rounded-full bg-emerald-400"
                    : "size-1.5 rounded-full bg-white/30"
                }
              />
              {details.online ? t("online") : t("offline")}
            </span>
          </div>
        </div>
        <div className={cn("flex flex-col", isConversations ? "gap-0.5" : "gap-2")}>
          <StatRow
            variant={variant}
            label={t("model")}
            value={details.modelLabel ?? "—"}
          />
          <StatRow
            variant={variant}
            label={t("language")}
            value={details.language}
          />
          {departmentLabel ? (
            <StatRow
              variant={variant}
              label={t("department")}
              value={departmentLabel}
            />
          ) : null}
        </div>
      </div>

      <div className="h-px bg-white/8" />

      <div className={cn("flex flex-col", isConversations ? "gap-1.5" : "gap-2")}>
        <SectionLabel>{t("currentTask")}</SectionLabel>
        <span className="text-sm text-white/85">
          {details.currentTaskTitle ?? t("currentTaskNone")}
        </span>
        {details.currentTaskTitle && !isConversations ? (
          <span className="text-xs text-white/40">{t("currentTaskHint")}</span>
        ) : null}
      </div>

      <div className="h-px bg-white/8" />

      <div className={cn("flex flex-col", isConversations ? "gap-0.5" : "gap-1")}>
        <SectionLabel>{t("statistics")}</SectionLabel>
        <StatRow
          variant={variant}
          label={t("conversationsToday")}
          value={String(details.stats.conversationsToday)}
        />
        <StatRow
          variant={variant}
          label={t("talkTime")}
          value={formatDurationSeconds(details.stats.talkTimeSeconds)}
        />
        <StatRow
          variant={variant}
          label={t("satisfaction")}
          value={
            details.stats.satisfaction !== null
              ? `${details.stats.satisfaction.toFixed(1)} / 5`
              : "—"
          }
        />
      </div>

      {details.activity && details.activity.length > 0 ? (
        <>
          <div className="h-px bg-white/8" />
          <div className="flex flex-col gap-2">
            <SectionLabel>{t("activity")}</SectionLabel>
            <ul className="flex flex-col gap-1.5">
              {[...details.activity].reverse().map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "text-xs",
                    isConversations
                      ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                      : "flex items-center justify-between gap-3",
                  )}
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-white/70">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${ACTIVITY_DOT[item.kind]}`}
                    />
                    <span className="truncate">{t(`activityKind.${item.kind}`)}</span>
                  </span>
                  <time className="shrink-0 text-[10px] text-white/35 tabular-nums">
                    {formatActivityTime(item.at)}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      <Link
        href={`/dashboard/employees/${details.employeeId}`}
        className={cn(
          "mt-auto flex items-center justify-between rounded-xl border border-white/10 bg-white/3 text-sm text-white transition-colors hover:bg-white/6",
          isConversations ? "px-3.5 py-2.5" : "px-4 py-2.5",
        )}
      >
        {t("viewFullProfile")}
        <ArrowRight className="size-4" />
      </Link>
    </aside>
  );
}
