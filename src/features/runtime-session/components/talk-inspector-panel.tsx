"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, TrendingUp, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { cn } from "@/lib/utils";
import { useTalkAnam } from "../context/talk-anam-context";
import type { TalkAgentDetails } from "./talk-agent-details";
import { TalkSessionControls } from "./talk-session-controls";

function ConfigCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 px-3 py-2.5">
      <p className="text-[10px] tracking-[0.12em] text-white/40 uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-white/85">{value}</p>
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

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatSatisfactionPercent(rating: number | null): {
  label: string;
  trend: string | null;
} {
  if (rating === null) {
    return { label: "—", trend: null };
  }

  const percent = Math.round((rating / 5) * 100);
  const delta = Math.round((rating - 4.5) * 20);
  return {
    label: `${percent}%`,
    trend: delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : null,
  };
}

function CurrentActivityBlock({
  pipelineLabel,
  elapsed,
  isLive,
}: {
  pipelineLabel: string;
  elapsed: number;
  isLive: boolean;
}) {
  const t = useTranslations("employees.talk.agentPanel");
  const progress = isLive ? Math.min(100, (elapsed % 120) / 1.2) : 0;

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-medium tracking-[0.16em] text-white/35 uppercase">
        {t("currentActivity")}
      </span>
      <div className="rounded-xl border border-white/8 bg-white/2 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs text-white/80">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isLive ? "bg-white/70" : "bg-white/30",
              )}
            />
            {pipelineLabel}
          </span>
          {isLive ? (
            <span className="text-[10px] text-white/40 tabular-nums">
              {formatElapsed(elapsed)}
            </span>
          ) : null}
        </div>
        {isLive ? (
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-white/35 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TalkInspectorPanel({
  details,
  departmentLabel,
  onEndSession,
  onFocusMode,
  focusMode,
  sessionBusy,
}: {
  details: TalkAgentDetails;
  departmentLabel: string | null;
  onEndSession: () => void;
  onFocusMode: () => void;
  focusMode: boolean;
  sessionBusy: boolean;
}) {
  const t = useTranslations("employees.talk");
  const tPanel = useTranslations("employees.talk.agentPanel");
  const { isLive, pipelineState } = useTalkAnam();
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const [timezoneLabel, setTimezoneLabel] = useState("UTC");

  useEffect(() => {
    setTimezoneLabel(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    if (!isLive) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isLive]);

  const pipelineLabel = isLive
    ? t(`stage.pipeline.${pipelineState}`)
    : tPanel("currentTaskNone");

  const satisfaction = formatSatisfactionPercent(details.stats.satisfaction);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#0a0a0a]">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        <TabsList
          variant="line"
          className="h-auto w-full shrink-0 justify-start gap-0 rounded-none border-b border-white/8 bg-transparent px-4 pt-3 pb-0"
        >
          <TabsTrigger
            value="details"
            className="rounded-none border-0 border-b-2 border-transparent px-3 pb-2.5 text-[11px] text-white/45 data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white"
          >
            {t("inspectorTabs.details")}
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-none border-0 border-b-2 border-transparent px-3 pb-2.5 text-[11px] text-white/45 data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white"
          >
            {t("inspectorTabs.activity")}
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="rounded-none border-0 border-b-2 border-transparent px-3 pb-2.5 text-[11px] text-white/45 data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white"
          >
            {t("inspectorTabs.notes")}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="details"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black">
                {details.avatarPreviewUrl && details.avatarReady ? (
                  <AvatarIdlePreview
                    src={details.avatarPreviewUrl}
                    alt={details.name}
                    sizes="48px"
                  />
                ) : (
                  <UserRound className="size-5 stroke-[1.25] text-white/40" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {details.name}
                </p>
                <p className="truncate text-[11px] text-white/45">
                  {details.role}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/60">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      details.online ? "bg-white/70" : "bg-white/30",
                    )}
                  />
                  {details.online ? tPanel("online") : tPanel("offline")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ConfigCell
                label={tPanel("model")}
                value={details.modelLabel ?? "—"}
              />
              <ConfigCell label={tPanel("language")} value={details.language} />
              {departmentLabel ? (
                <ConfigCell
                  label={tPanel("department")}
                  value={departmentLabel}
                />
              ) : null}
              <ConfigCell label={tPanel("timezone")} value={timezoneLabel} />
            </div>

            <CurrentActivityBlock
              pipelineLabel={pipelineLabel}
              elapsed={elapsed}
              isLive={isLive}
            />

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-medium tracking-[0.16em] text-white/35 uppercase">
                {tPanel("statistics")}
              </span>
              <div className="space-y-1 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="flex items-center justify-between gap-3 py-1 text-xs">
                  <span className="text-white/40">
                    {tPanel("conversationsToday")}
                  </span>
                  <span className="font-medium text-white/80 tabular-nums">
                    {details.stats.conversationsToday}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1 text-xs">
                  <span className="text-white/40">{tPanel("talkTime")}</span>
                  <span className="font-medium text-white/80 tabular-nums">
                    {formatDurationSeconds(details.stats.talkTimeSeconds)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 py-1 text-xs">
                  <span className="text-white/40">{tPanel("satisfaction")}</span>
                  <span className="flex items-center gap-1.5 font-medium text-white/80 tabular-nums">
                    {satisfaction.label}
                    {satisfaction.trend ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-white/45">
                        <TrendingUp className="size-3 stroke-[1.5]" />
                        {satisfaction.trend}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>

            <TalkSessionControls
              onNotes={() => setActiveTab("notes")}
              onEndSession={onEndSession}
              onFocusMode={onFocusMode}
              focusMode={focusMode}
              disabled={sessionBusy}
            />
          </div>

          <Link
            href={`/dashboard/employees/${details.employeeId}`}
            className="mt-auto flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.06]"
          >
            {tPanel("viewFullProfile")}
            <ArrowRight className="size-4" />
          </Link>
        </TabsContent>

        <TabsContent
          value="activity"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4"
        >
          {details.activity && details.activity.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {[...details.activity].reverse().map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2 text-xs"
                >
                  <span className="text-white/70">
                    {tPanel(`activityKind.${item.kind}`)}
                  </span>
                  <time className="shrink-0 text-[10px] text-white/35 tabular-nums">
                    {formatActivityTime(item.at)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-xs text-white/35">
              {t("inspectorTabs.activityEmpty")}
            </p>
          )}
        </TabsContent>

        <TabsContent
          value="notes"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 py-4"
        >
          <p className="py-8 text-center text-xs text-white/35">
            {t("inspectorTabs.notesEmpty")}
          </p>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
