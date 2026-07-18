"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWorkspacePermissions } from "@/features/workspace/components/workspace-permissions-provider";
import { useFormatOrganizationDate } from "@/features/workspace/components/workspace-display-preferences-provider";
import { Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EmployeeLoadout } from "@/features/rewards/lib/loadout";
import {
  COSMETIC_EQUIP_BADGE,
  hasAnyLoadoutEquipped,
  resolveCosmeticBackgroundSrc,
  resolveCosmeticFrameSrc,
} from "@/features/rewards/lib/cosmetic-assets";
import type { EmployeeListItem } from "../types";
import { AvatarIdlePreview } from "./avatar-idle-preview";
import { EmployeeMaterializationCardPreview } from "./employee-materialization-card-preview";
import { EmployeeStatusBadge } from "./employee-status-badge";

function isEmployeeMaterializing(employee: EmployeeListItem): boolean {
  if (employee.canTalk) {
    return false;
  }

  return (
    employee.avatarProvisioningStatus !== "failed" &&
    employee.sessionProvisioningStatus !== "failed"
  );
}

function provisioningLabel(
  status: EmployeeListItem["avatarProvisioningStatus"],
  t: ReturnType<typeof useTranslations<"employees.card">>,
): string {
  if (status === "provisioning") {
    return t("provisioningAvatar");
  }

  if (status === "pending") {
    return t("queuedProvisioning");
  }

  if (status === "failed") {
    return t("provisioningFailed");
  }

  return "";
}

export function EmployeeCard({
  employee,
  loadout = null,
}: {
  employee: EmployeeListItem;
  loadout?: EmployeeLoadout | null;
}) {
  const t = useTranslations("employees.card");
  const tActions = useTranslations("common.actions");
  const permissions = useWorkspacePermissions();
  const { formatDate } = useFormatOrganizationDate();
  const canTalk = employee.canTalk && permissions.canOperateEmployees;
  const createdLabel = formatDate(employee.createdAt);
  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";
  const isMaterializing = isEmployeeMaterializing(employee);
  const showPreview =
    employee.avatarPreviewUrl &&
    employee.avatarProvisioningStatus === "ready" &&
    !isMaterializing;
  const backgroundSrc = resolveCosmeticBackgroundSrc(loadout?.backgroundId);
  const frameSrc = resolveCosmeticFrameSrc(loadout?.frameId);
  const showEquipBadge = loadout ? hasAnyLoadoutEquipped(loadout) : false;

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden border-white/10 bg-[#111111] py-0 text-white ring-white/10">
      <div className="relative flex aspect-4/3 items-center justify-center border-b border-white/10 bg-white/3">
        {backgroundSrc ? (
          <Image
            src={backgroundSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover opacity-45"
            aria-hidden
          />
        ) : null}
        {showPreview ? (
          <div className="relative z-10 size-full">
            <AvatarIdlePreview
              src={employee.avatarPreviewUrl!}
              alt={employee.name}
              sizes="(max-width: 768px) 100vw, 320px"
            />
          </div>
        ) : isMaterializing ? (
          <div className="relative z-10 size-full">
            <EmployeeMaterializationCardPreview
              portraitUrl={employee.avatarPreviewUrl}
              name={employee.name}
              label={provisioningLabel(employee.avatarProvisioningStatus, t)}
            />
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-2 text-white/40">
            {isProvisioning ? (
              <Loader2 className="size-8 animate-spin stroke-[1.25]" />
            ) : (
              <UserRound className="size-8 stroke-[1.25]" />
            )}
            <span className="px-4 text-center text-xs tracking-wide uppercase">
              {provisioningLabel(employee.avatarProvisioningStatus, t) ||
                t("avatarPreview")}
            </span>
          </div>
        )}
        {frameSrc ? (
          <Image
            src={frameSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="pointer-events-none z-[15] object-fill"
            aria-hidden
          />
        ) : null}
        {showEquipBadge ? (
          <Image
            src={COSMETIC_EQUIP_BADGE}
            alt=""
            width={28}
            height={28}
            className="absolute top-2.5 right-2.5 z-20 size-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
            aria-hidden
          />
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-2">
          <div className="min-w-0">
            <Link
              href={`/dashboard/employees/${employee.id}`}
              className="truncate text-base font-medium text-white hover:text-white/80"
            >
              {employee.name}
            </Link>
            <p className="truncate text-sm text-white/60">{employee.role}</p>
          </div>
          <EmployeeStatusBadge status={employee.status} />
          {employee.avatarProvisioningStatus === "failed" &&
          employee.avatarProvisioningFailureReason ? (
            <p
              className="line-clamp-2 text-xs leading-relaxed text-white/50"
              role="alert"
              title={employee.avatarProvisioningFailureReason}
            >
              {employee.avatarProvisioningFailureReason}
            </p>
          ) : null}
          {employee.sessionProvisioningStatus === "failed" &&
          employee.sessionProvisioningFailureReason ? (
            <p
              className="line-clamp-2 text-xs leading-relaxed text-white/50"
              role="alert"
              title={employee.sessionProvisioningFailureReason}
            >
              {employee.sessionProvisioningFailureReason}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={!canTalk}
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/5 disabled:opacity-40"
              asChild={canTalk}
            >
              {canTalk ? (
                <Link href={`/dashboard/employees/${employee.id}/talk`}>
                  {tActions("talk")}
                </Link>
              ) : (
                <span>{tActions("talk")}</span>
              )}
            </Button>
            <Button
              type="button"
              disabled={!canTalk}
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/5 disabled:opacity-40"
              asChild={canTalk}
            >
              {canTalk ? (
                <Link href={`/dashboard/employees/${employee.id}/scenarios`}>
                  {tActions("runScenario")}
                </Link>
              ) : (
                <span>{tActions("runScenario")}</span>
              )}
            </Button>
          </div>
          <span className="text-xs text-white/50">{createdLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
