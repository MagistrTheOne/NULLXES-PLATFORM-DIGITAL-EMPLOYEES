"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, Radio, UserRound } from "lucide-react";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "../lib/office-layout";
import { resolveActivityBadgeLabel } from "../lib/resolve-activity-label";
import type { HqActivity, HqDepartmentGroup, HqEmployee } from "../types";

function ActivityLabel({ activity }: { activity: HqActivity }) {
  const t = useTranslations("hq.activity");
  const label = resolveActivityBadgeLabel(activity.badge, t);

  if (!label) {
    return <span className="text-xs text-muted-foreground">{t("idle")}</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        activity.kind === "in_session"
          ? "text-foreground"
          : "text-muted-foreground",
      )}
    >
      {activity.kind === "in_session" ? (
        <Radio className="size-3 stroke-[1.5]" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

function DirectoryEmployee({ employee }: { employee: HqEmployee }) {
  const t = useTranslations("hq.directory");
  const showPreview =
    employee.avatarPreviewUrl &&
    employee.avatarProvisioningStatus === "ready";
  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";

  return (
    <Link
      href={`/dashboard/employees/${employee.id}`}
      title={t("viewProfile")}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-white/3"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white/2">
        {showPreview ? (
          <AvatarIdlePreview
            src={employee.avatarPreviewUrl!}
            alt={employee.name}
            sizes="40px"
          />
        ) : isProvisioning ? (
          <Loader2 className="size-4 animate-spin stroke-[1.25] text-muted-foreground" />
        ) : (
          <UserRound className="size-4 stroke-[1.25] text-muted-foreground" />
        )}
        <span
          className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card"
          style={{ backgroundColor: STATUS_COLORS[employee.runtimeStatus] }}
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {employee.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {employee.role}
        </span>
      </div>
      <ActivityLabel activity={employee.activity} />
    </Link>
  );
}

function DepartmentColumn({ group }: { group: HqDepartmentGroup }) {
  const tDepartments = useTranslations("hq.departments");
  const t = useTranslations("hq.directory");

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {tDepartments(group.department)}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {t("headcount", { count: group.employees.length })}
        </span>
      </header>
      {group.employees.length === 0 ? (
        <p className="px-1 py-6 text-center text-xs text-muted-foreground">
          {t("noEmployees")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {group.employees.map((employee) => (
            <DirectoryEmployee key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HqDirectory({
  departments,
}: {
  departments: HqDepartmentGroup[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {departments.map((group) => (
        <DepartmentColumn key={group.department} group={group} />
      ))}
    </div>
  );
}
