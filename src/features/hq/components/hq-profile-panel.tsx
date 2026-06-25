"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, MessageSquare, Settings2, UserRound } from "lucide-react";
import type { BrainProvider } from "@/entities/digital-employee";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { formatDurationSeconds } from "@/features/analytics/lib/format-duration";
import { STATUS_COLORS } from "../lib/office-layout";
import { resolveActivityBadgeLabel } from "../lib/resolve-activity-label";
import { useOfficeStore } from "../store/use-office-store";
import type { HqEmployee } from "../types";

const BRAIN_LABELS: Record<BrainProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  nullxes: "NULLXES Brain",
};

function formatRuntime(createdAt: Date | string): string {
  const created = new Date(createdAt).getTime();
  const diff = Math.max(0, Date.now() - created);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

function formatLastSession(value: Date | string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-xs">
      <span className="text-white/45">{label}</span>
      <span className="truncate text-right text-white/85">{value}</span>
    </div>
  );
}

export function HqProfilePanel({ employees }: { employees: HqEmployee[] }) {
  const t = useTranslations("hq.profile");
  const tFields = useTranslations("hq.profile.fields");
  const tTabs = useTranslations("hq.profile.tabs");
  const tActivity = useTranslations("hq.activity");
  const tDepartments = useTranslations("hq.departments");
  const tLegend = useTranslations("hq.legend");
  const selectedId = useOfficeStore((state) => state.selectedEmployeeId);
  const openTalk = useOfficeStore((state) => state.openTalk);

  const employee = employees.find((item) => item.id === selectedId) ?? null;

  if (!employee) {
    return (
      <aside className="relative z-10 flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0B0B0B] p-6 text-center">
        <UserRound className="size-7 stroke-[1.25] text-white/30" />
        <p className="mt-3 text-sm text-white/40">{t("emptyTitle")}</p>
        <p className="mt-1 text-xs text-white/25">{t("emptyHint")}</p>
      </aside>
    );
  }

  const statusColor = STATUS_COLORS[employee.runtimeStatus];
  const showPreview =
    employee.avatarPreviewUrl && employee.avatarProvisioningStatus === "ready";
  const currentTaskLabel = resolveActivityBadgeLabel(
    employee.activity.badge,
    tActivity,
  );
  const currentTask = currentTaskLabel ?? tActivity("idle");
  const hasTask = employee.tasksToday > 0 || currentTaskLabel !== null;

  return (
    <aside className="relative z-10 flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-[#0B0B0B] p-5">
      <div className="flex items-center gap-3">
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black">
          {showPreview ? (
            <AvatarIdlePreview
              src={employee.avatarPreviewUrl!}
              alt={employee.name}
              sizes="48px"
            />
          ) : (
            <UserRound className="size-5 stroke-[1.25] text-white/40" />
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-white">
            {employee.name}
          </span>
          <span className="truncate text-xs text-white/45">{employee.role}</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/70">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            {tLegend(employee.runtimeStatus)}
          </span>
        </div>
      </div>

      <Tabs defaultValue="profile" className="flex min-h-0 flex-1 flex-col gap-3">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">{tTabs("profile")}</TabsTrigger>
          <TabsTrigger value="tasks">{tTabs("tasks")}</TabsTrigger>
          <TabsTrigger value="metrics">{tTabs("metrics")}</TabsTrigger>
          <TabsTrigger value="activity">{tTabs("activity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <ProfileRow
            label={tFields("status")}
            value={tLegend(employee.runtimeStatus)}
          />
          <ProfileRow label={tFields("currentTask")} value={currentTask} />
          <ProfileRow
            label={tFields("department")}
            value={tDepartments(employee.department)}
          />
          <ProfileRow
            label={tFields("model")}
            value={BRAIN_LABELS[employee.brainProvider]}
          />
          <ProfileRow
            label={tFields("runtime")}
            value={formatRuntime(employee.createdAt)}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-0">
          {hasTask ? (
            <>
              <ProfileRow label={tFields("currentTask")} value={currentTask} />
              <ProfileRow
                label={tFields("tasksToday")}
                value={String(employee.tasksToday)}
              />
            </>
          ) : (
            <p className="py-6 text-center text-xs text-white/35">
              {t("noTasks")}
            </p>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="mt-0">
          <ProfileRow
            label={tFields("sessions")}
            value={String(employee.sessionsInRange)}
          />
          <ProfileRow
            label={tFields("conversationTime")}
            value={formatDurationSeconds(employee.conversationSeconds)}
          />
          <ProfileRow
            label={tFields("satisfaction")}
            value={
              employee.satisfactionAvg !== null
                ? employee.satisfactionAvg.toFixed(1)
                : t("none")
            }
          />
          <ProfileRow
            label={tFields("tasksToday")}
            value={String(employee.tasksToday)}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <ProfileRow
            label={tFields("live")}
            value={employee.isLive ? "●" : t("none")}
          />
          <ProfileRow
            label={tFields("lastSession")}
            value={formatLastSession(employee.lastSessionAt, t("none"))}
          />
          <ProfileRow
            label={tFields("sessions")}
            value={String(employee.sessionsInRange)}
          />
        </TabsContent>
      </Tabs>

      <Link
        href={`/dashboard/employees/${employee.id}`}
        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.06]"
      >
        {t("openProfile")}
        <ArrowRight className="size-4" />
      </Link>

      <div className="grid grid-cols-2 gap-2">
        {employee.canTalk ? (
          <button
            type="button"
            onClick={() => openTalk(employee.id)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white transition-colors hover:bg-white/[0.06]"
          >
            <MessageSquare className="size-3.5" />
            {t("actions.talk")}
          </button>
        ) : null}
        <Link
          href={`/dashboard/employees/${employee.id}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Settings2 className="size-3.5" />
          {t("actions.settings")}
        </Link>
      </div>
    </aside>
  );
}
