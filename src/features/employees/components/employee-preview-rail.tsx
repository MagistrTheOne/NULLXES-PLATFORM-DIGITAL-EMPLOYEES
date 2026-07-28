import Link from "next/link";
import { Loader2, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import type { EmployeeDetailShell } from "../types";
import { AvatarIdlePreview } from "./avatar-idle-preview";
import { EmployeeLoadoutSummary } from "./employee-loadout-summary";
import { EmployeeStatusBadge } from "./employee-status-badge";
import type { RewardItem } from "@/features/rewards/lib/catalog";
import type { EmployeeLoadout } from "@/features/rewards/lib/loadout";
import { emptyLoadout } from "@/features/rewards/lib/loadout";
import {
  COSMETIC_EQUIP_BADGE,
  hasAnyLoadoutEquipped,
  resolveCosmeticBackgroundSrc,
  resolveCosmeticFrameSrc,
} from "@/features/rewards/lib/cosmetic-assets";
import Image from "next/image";

function resolveReadinessKey(employee: EmployeeDetailShell): {
  key: "talkReady" | "settingUp" | "needsAttention";
  tone: string;
} {
  const failed =
    employee.avatarProvisioningStatus === "failed" ||
    employee.sessionProvisioningStatus === "failed" ||
    employee.brainProvisioningStatus === "failed";

  if (failed) {
    return {
      key: "needsAttention",
      tone: "border-white/20 bg-white/5 text-white/75",
    };
  }

  if (employee.canTalk) {
    return {
      key: "talkReady",
      tone: "border-white/20 bg-white/8 text-white",
    };
  }

  return {
    key: "settingUp",
    tone: "border-white/12 bg-white/4 text-white/65",
  };
}

export async function EmployeePreviewRail({
  employee,
  displayPreferences: _displayPreferences,
  talkBlockers,
  authGateHref,
  sticky = true,
  loadout = emptyLoadout(),
  rewards = [],
}: {
  employee: EmployeeDetailShell;
  displayPreferences: OrganizationDisplayPreferences;
  talkBlockers: string[];
  /** When set (e.g. `/login`), Talk / Scenario route through auth first. */
  authGateHref?: string;
  sticky?: boolean;
  loadout?: EmployeeLoadout;
  rewards?: RewardItem[];
}) {
  const t = await getTranslations("employees.detail");
  const tCommon = await getTranslations("common.actions");

  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";
  const showPreview =
    employee.avatarPreviewUrl && employee.avatarProvisioningStatus === "ready";
  const talkHref = authGateHref ?? `/dashboard/employees/${employee.id}/talk`;
  const scenarioHref =
    authGateHref ?? `/dashboard/employees/${employee.id}/scenarios`;
  const canActivateTalk = Boolean(authGateHref) || employee.canTalk;
  const backgroundSrc = resolveCosmeticBackgroundSrc(loadout.backgroundId);
  const frameSrc = resolveCosmeticFrameSrc(loadout.frameId);
  const showEquipBadge = hasAnyLoadoutEquipped(loadout);
  const readiness = resolveReadinessKey(employee);

  return (
    <Card
      className={cn(
        "overflow-hidden border-white/10 bg-[#111111] py-0 text-white",
        sticky && "xl:sticky xl:top-6",
      )}
    >
      <div className="relative aspect-4/3 bg-white/3">
        {backgroundSrc ? (
          <Image
            src={backgroundSrc}
            alt=""
            fill
            sizes="320px"
            className="object-cover opacity-45"
            aria-hidden
          />
        ) : null}
        {showPreview ? (
          <div className="relative z-10 size-full">
            <AvatarIdlePreview
              src={employee.avatarPreviewUrl!}
              alt={employee.name}
              sizes="320px"
            />
          </div>
        ) : (
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 text-white/40">
            {isProvisioning ? (
              <Loader2 className="size-8 animate-spin" />
            ) : (
              <UserRound className="size-8" />
            )}
            <span className="text-xs tracking-wide">
              {isProvisioning ? t("readiness.settingUp") : t("readiness.portraitPending")}
            </span>
          </div>
        )}
        {frameSrc ? (
          <Image
            src={frameSrc}
            alt=""
            fill
            sizes="320px"
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
      <CardContent className="flex flex-col gap-4 px-5 py-5">
        <div className="space-y-1">
          <p className="text-lg font-medium leading-tight">{employee.name}</p>
          <p className="text-sm text-white/55">{employee.role}</p>
          <div className="pt-1">
            <EmployeeLoadoutSummary loadout={loadout} rewards={rewards} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EmployeeStatusBadge status={employee.status} />
          <Badge
            variant="outline"
            className={cn("rounded-md font-normal", readiness.tone)}
          >
            {t(`readiness.${readiness.key}`)}
          </Badge>
        </div>

        <Button
          type="button"
          disabled={!canActivateTalk}
          className="bg-white text-black hover:bg-white/90 disabled:opacity-40"
          asChild={canActivateTalk}
        >
          {canActivateTalk ? (
            <Link href={talkHref}>{tCommon("talk")}</Link>
          ) : (
            <span>{tCommon("talk")}</span>
          )}
        </Button>
        <Button
          type="button"
          disabled={!canActivateTalk}
          variant="outline"
          className="border-white/12 bg-transparent text-white hover:bg-white/5 disabled:opacity-40"
          asChild={canActivateTalk}
        >
          {canActivateTalk ? (
            <Link href={scenarioHref}>{tCommon("runScenario")}</Link>
          ) : (
            <span>{tCommon("runScenario")}</span>
          )}
        </Button>
        {!employee.canTalk && !authGateHref ? (
          <div className="space-y-1 text-xs text-white/45">
            <p>{t("talkLocked")}</p>
            {talkBlockers.map((blocker) => (
              <p key={blocker}>{t(`talkBlocker.${blocker}`)}</p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
