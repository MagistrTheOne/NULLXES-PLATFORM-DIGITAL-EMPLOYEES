"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  ClipboardList,
  MessageSquare,
  Pause,
  UserRound,
} from "lucide-react";
import type { BrainProvider } from "@/entities/digital-employee";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { cn } from "@/lib/utils";
import { pauseHqEmployeeAction } from "../actions/pause-hq-employee";
import { STATUS_COLORS } from "../lib/office-layout";
import { resolveActivityBadgeLabel } from "../lib/resolve-activity-label";
import { useOfficeStore } from "../store/use-office-store";
import type { HqEmployee, HqMissionStage } from "../types";

const BRAIN_LABELS: Record<BrainProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  nullxes: "NULLXES Brain",
};

const STAGE_ORDER: HqMissionStage[] = [
  "research",
  "draft",
  "awaiting_approval",
  "sent",
];

function StageRail({
  stage,
  labels,
}: {
  stage: HqMissionStage | null;
  labels: Record<HqMissionStage, string>;
}) {
  const activeIndex = stage ? STAGE_ORDER.indexOf(stage) : -1;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STAGE_ORDER.map((key, index) => {
        const reached = activeIndex >= 0 && index <= activeIndex;
        const current = key === stage;
        return (
          <span key={key} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span className="text-[10px] text-white/20" aria-hidden>
                →
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] tracking-wide uppercase",
                current
                  ? "border-white/25 bg-white/10 text-white"
                  : reached
                    ? "border-white/12 text-white/55"
                    : "border-white/8 text-white/30",
              )}
            >
              {labels[key]}
            </span>
          </span>
        );
      })}
    </div>
  );
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
  const router = useRouter();
  const t = useTranslations("hq.profile");
  const tFields = useTranslations("hq.profile.fields");
  const tActivity = useTranslations("hq.activity");
  const tDepartments = useTranslations("hq.departments");
  const tLegend = useTranslations("hq.legend");
  const tStages = useTranslations("hq.profile.stages");
  const selectedId = useOfficeStore((state) => state.selectedEmployeeId);
  const openTalk = useOfficeStore((state) => state.openTalk);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
  const lastAction =
    employee.mission?.lastAction ??
    currentTaskLabel ??
    (employee.isLive ? tActivity("inSession") : tActivity("idle"));

  function handlePause() {
    setPauseError(null);
    startTransition(async () => {
      const result = await pauseHqEmployeeAction(employee!.id);
      if (!result.ok) {
        setPauseError(result.message);
        return;
      }
      router.refresh();
    });
  }

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
            {employee.isLive ? (
              <span className="text-white/40">· {tFields("live")}</span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div>
          <p className="text-[10px] tracking-[0.14em] text-white/40 uppercase">
            {tFields("currentMission")}
          </p>
          <p className="mt-1 text-sm text-white/90">
            {employee.mission?.title ?? t("noMission")}
          </p>
        </div>
        <StageRail
          stage={employee.mission?.stage ?? null}
          labels={{
            research: tStages("research"),
            draft: tStages("draft"),
            awaiting_approval: tStages("awaitingApproval"),
            sent: tStages("sent"),
          }}
        />
        <ProfileRow label={tFields("lastAction")} value={lastAction} />
        <ProfileRow
          label={tFields("department")}
          value={tDepartments(employee.department)}
        />
        <ProfileRow
          label={tFields("model")}
          value={BRAIN_LABELS[employee.brainProvider]}
        />
      </div>

      {pauseError ? (
        <p className="text-xs text-red-300/80">{pauseError}</p>
      ) : null}

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
        <button
          type="button"
          onClick={handlePause}
          disabled={isPending || employee.status === "paused"}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
        >
          <Pause className="size-3.5" />
          {t("actions.pause")}
        </button>
        <Link
          href={`/dashboard/missions/new?employeeId=${employee.id}`}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ClipboardList className="size-3.5" />
          {t("actions.assignTask")}
        </Link>
      </div>
    </aside>
  );
}
