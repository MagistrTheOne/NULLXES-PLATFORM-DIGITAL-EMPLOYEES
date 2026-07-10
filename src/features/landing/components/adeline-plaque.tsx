"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Archive, Circle, Loader2, Pause, Radio, UserRound } from "lucide-react";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { AvatarIdlePreview } from "@/features/employees/components/avatar-idle-preview";
import { formatRelativeTime } from "@/features/overview/lib/format-relative-time";
import { ADELINE_KALEN_EMPLOYEE_ID } from "@/shared/config/xai-voice-env";
import { cn } from "@/lib/utils";
import type { AdelineLandingPlaque } from "../services/get-adeline-landing-plaque";

const STATUS_ICONS: Record<
  EmployeeStatus,
  { Icon: typeof Radio; dim?: boolean }
> = {
  active: { Icon: Radio },
  paused: { Icon: Pause, dim: true },
  draft: { Icon: Circle, dim: true },
  archived: { Icon: Archive, dim: true },
};

const MARKETING_PORTRAIT = "/marketing/adeline-kalen.jpg";

/**
 * Product employee plaque — same card chrome as Overview carousel
 * (`OverviewEmployeeCarousel`), keyed to Adeline Kalen.
 * @see https://www.nullxesdai.online/dashboard/employees/b0ab9bc2-aed4-4e1c-875f-dfb9180d234a
 */
export function AdelinePlaque({ plaque }: { plaque: AdelineLandingPlaque }) {
  const locale = useLocale();
  const t = useTranslations("dashboard.carousel");
  const tStatus = useTranslations("employees.status");
  const { Icon, dim } = STATUS_ICONS[plaque.status];

  const employeeId = plaque.id || ADELINE_KALEN_EMPLOYEE_ID;
  const livePreview =
    plaque.avatarPreviewUrl && plaque.avatarProvisioningStatus === "ready"
      ? plaque.avatarPreviewUrl
      : null;
  const previewSrc = livePreview ?? MARKETING_PORTRAIT;
  const isProvisioning =
    !livePreview &&
    (plaque.avatarProvisioningStatus === "pending" ||
      plaque.avatarProvisioningStatus === "provisioning");

  const talkedLabel = plaque.lastSessionAt
    ? t("talked", {
        time: formatRelativeTime(new Date(plaque.lastSessionAt), locale),
      })
    : t("noSessions");

  return (
    <Link
      href={`/dashboard/employees/${employeeId}`}
      data-employee-id={employeeId}
      className={cn(
        "group flex w-full max-w-[280px] flex-col overflow-hidden rounded-2xl",
        "border border-white/10 bg-[#111111] text-white",
        "shadow-[0_30px_80px_rgba(0,0,0,0.55)] transition-colors hover:bg-white/3",
      )}
    >
      <div className="relative flex aspect-4/3 items-center justify-center border-b border-white/8 bg-white/2">
        {isProvisioning ? (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <Loader2 className="size-7 animate-spin stroke-[1.25]" />
          </div>
        ) : previewSrc ? (
          <AvatarIdlePreview
            src={previewSrc}
            alt={plaque.name}
            sizes="280px"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <UserRound className="size-7 stroke-[1.25]" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white group-hover:text-white/85">
              {plaque.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/50">{plaque.role}</p>
          </div>
          <span
            className="flex items-center text-white/45"
            title={tStatus(plaque.status)}
            aria-label={tStatus(plaque.status)}
          >
            <Icon
              className={cn("size-3.5 stroke-[1.5]", dim && "opacity-50")}
              aria-hidden
            />
          </span>
        </div>
        <div className="mt-auto space-y-0.5 text-xs text-white/45">
          <p className="truncate">{talkedLabel}</p>
          <p className="tabular-nums text-white/75">
            {t("sessionsInPeriod", { count: plaque.sessionsInRange })}
          </p>
        </div>
      </div>
    </Link>
  );
}
