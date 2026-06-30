"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Archive, Circle, Loader2, Pause, Plus, Radio, UserRound } from "lucide-react";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "../lib/format-relative-time";
import type { OverviewEmployee } from "../types";
import { OverviewCard } from "./overview-card";

const STATUS_ICONS: Record<
  EmployeeStatus,
  { Icon: typeof Radio; dim?: boolean }
> = {
  active: { Icon: Radio },
  paused: { Icon: Pause, dim: true },
  draft: { Icon: Circle, dim: true },
  archived: { Icon: Archive, dim: true },
};

function EmployeeStatusIcon({ status }: { status: EmployeeStatus }) {
  const t = useTranslations("employees.status");
  const { Icon, dim } = STATUS_ICONS[status];

  return (
    <span
      className="flex items-center text-muted-foreground"
      title={t(status)}
      aria-label={t(status)}
    >
      <Icon
        className={cn("size-3.5 stroke-[1.5]", dim && "opacity-50")}
        aria-hidden
      />
    </span>
  );
}

function CarouselEmployeeCard({
  employee,
  fullWidth,
}: {
  employee: OverviewEmployee;
  fullWidth?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard.carousel");
  const showPreview =
    employee.avatarPreviewUrl &&
    employee.avatarProvisioningStatus === "ready";
  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";
  const talkedLabel = employee.lastSessionAt
    ? t("talked", { time: formatRelativeTime(employee.lastSessionAt, locale) })
    : t("noSessions");

  return (
    <Link
      href={`/dashboard/employees/${employee.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-white/3",
        fullWidth ? "w-full" : "w-[220px] shrink-0",
      )}
    >
      <div className="relative flex aspect-4/3 items-center justify-center border-b border-border bg-white/2">
        {showPreview ? (
          <AvatarIdlePreview
            src={employee.avatarPreviewUrl!}
            alt={employee.name}
            sizes="220px"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isProvisioning ? (
              <Loader2 className="size-7 animate-spin stroke-[1.25]" />
            ) : (
              <UserRound className="size-7 stroke-[1.25]" />
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground group-hover:text-foreground/80">
              {employee.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{employee.role}</p>
          </div>
          <EmployeeStatusIcon status={employee.status} />
        </div>
        <div className="mt-auto space-y-0.5 text-xs text-muted-foreground">
          <p>{talkedLabel}</p>
          <p className="tabular-nums text-foreground/80">
            {t("sessionsInPeriod", { count: employee.sessionsInRange })}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CreateEmployeeCard({
  onCreateClick,
  fullWidth,
}: {
  onCreateClick: () => void;
  fullWidth?: boolean;
}) {
  const t = useTranslations("common.actions");

  return (
    <button
      type="button"
      onClick={onCreateClick}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-white/3 hover:text-foreground",
        fullWidth ? "w-full" : "w-[220px] shrink-0",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background">
        <Plus className="size-5" />
      </span>
      <span className="text-sm font-medium">{t("createEmployee")}</span>
    </button>
  );
}

/** Grid for small teams; arrow carousel once the row would overflow. */
const GRID_LAYOUT_THRESHOLD = 6;

export function OverviewEmployeeCarousel({
  employees,
  onCreateClick,
}: {
  employees: OverviewEmployee[];
  onCreateClick: () => void;
}) {
  const t = useTranslations("dashboard.carousel");
  const activeFirst = [...employees].sort((left, right) => {
    if (left.status === "active" && right.status !== "active") {
      return -1;
    }
    if (right.status === "active" && left.status !== "active") {
      return 1;
    }
    return right.sessionsInRange - left.sessionsInRange;
  });

  if (activeFirst.length === 0) {
    return (
      <OverviewCard title={t("title")} description={t("description")}>
        <div className="flex min-h-[220px] w-full items-center justify-center p-5">
          <CreateEmployeeCard onCreateClick={onCreateClick} />
        </div>
      </OverviewCard>
    );
  }

  const useGrid = activeFirst.length <= GRID_LAYOUT_THRESHOLD;

  return (
    <OverviewCard title={t("title")} description={t("description")}>
      {useGrid ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 p-5">
          {activeFirst.map((employee) => (
            <CarouselEmployeeCard key={employee.id} employee={employee} fullWidth />
          ))}
          <CreateEmployeeCard onCreateClick={onCreateClick} fullWidth />
        </div>
      ) : (
        <div className="relative px-5 py-5">
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ms-4">
              {activeFirst.map((employee) => (
                <CarouselItem key={employee.id} className="basis-[220px] ps-4">
                  <CarouselEmployeeCard employee={employee} />
                </CarouselItem>
              ))}
              <CarouselItem className="basis-[220px] ps-4">
                <CreateEmployeeCard onCreateClick={onCreateClick} />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="start-2 border-border bg-background/90 backdrop-blur-sm hover:bg-background" />
            <CarouselNext className="end-2 border-border bg-background/90 backdrop-blur-sm hover:bg-background" />
          </Carousel>
        </div>
      )}
    </OverviewCard>
  );
}
