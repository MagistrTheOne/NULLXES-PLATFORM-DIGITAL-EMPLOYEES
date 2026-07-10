import Link from "next/link";
import { AudioLines, Loader2, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProviderProvisioningStatus } from "@/entities/provider-config";
import {
  formatOrganizationDate,
} from "@/shared/i18n/format-organization-date";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import type { EmployeeDetailShell } from "../types";
import { EmployeeGrokVoiceButton } from "./employee-grok-voice-button";
import { AvatarIdlePreview } from "./avatar-idle-preview";
import { EmployeeProviderBadge } from "./employee-provider-badge";
import { EmployeeStatusBadge } from "./employee-status-badge";

function ProvisioningChip({
  label,
  status,
}: {
  label: string;
  status: ProviderProvisioningStatus;
}) {
  const tone =
    status === "ready"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : status === "failed"
        ? "border-red-500/30 bg-red-500/10 text-red-200"
        : status === "provisioning" || status === "pending"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
          : "border-white/10 bg-white/3 text-white/50";

  return (
    <Badge variant="outline" className={cn("rounded-md font-normal", tone)}>
      {label}: {status}
    </Badge>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-end text-white/85">{value}</span>
    </div>
  );
}

export async function EmployeePreviewRail({
  employee,
  displayPreferences,
  talkBlockers,
  authGateHref,
  sticky = true,
}: {
  employee: EmployeeDetailShell;
  displayPreferences: OrganizationDisplayPreferences;
  talkBlockers: string[];
  /** When set (e.g. `/login`), Talk / Voice / Scenario route through auth first. */
  authGateHref?: string;
  sticky?: boolean;
}) {
  const t = await getTranslations("employees.detail");
  const tCommon = await getTranslations("common.actions");
  const tStatus = await getTranslations("employees.status");

  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";
  const showPreview =
    employee.avatarPreviewUrl && employee.avatarProvisioningStatus === "ready";
  const talkHref = authGateHref ?? `/dashboard/employees/${employee.id}/talk`;
  const scenarioHref =
    authGateHref ?? `/dashboard/employees/${employee.id}/scenarios`;
  const canActivateTalk = Boolean(authGateHref) || employee.canTalk;

  return (
    <Card
      className={cn(
        "overflow-hidden border-white/10 bg-[#111111] py-0 text-white",
        sticky && "xl:sticky xl:top-6",
      )}
    >
      <div className="relative aspect-4/3 bg-white/3">
        {showPreview ? (
          <AvatarIdlePreview
            src={employee.avatarPreviewUrl!}
            alt={employee.name}
            sizes="320px"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40">
            {isProvisioning ? (
              <Loader2 className="size-8 animate-spin" />
            ) : (
              <UserRound className="size-8" />
            )}
            <span className="text-xs tracking-wide uppercase">
              {employee.avatarProvisioningStatus}
            </span>
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-4 px-5 py-5">
        <div className="space-y-1">
          <p className="text-lg font-medium leading-tight">{employee.name}</p>
          <p className="text-sm text-white/55">{employee.role}</p>
        </div>

        <EmployeeStatusBadge status={employee.status} />

        <div className="space-y-2 rounded-lg border border-white/8 bg-black/20 px-3 py-3">
          <MetaRow label={t("status")} value={tStatus(employee.status)} />
          <MetaRow
            label={t("created")}
            value={formatOrganizationDate(employee.createdAt, {
              dateFormat: displayPreferences.dateFormat,
              locale: displayPreferences.language,
            })}
          />
          <MetaRow
            label={t("knowledgeSources")}
            value={String(employee.knowledgeSourcesCount)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <ProvisioningChip label={t("avatar")} status={employee.avatarProvisioningStatus} />
          <ProvisioningChip label={t("voice")} status={employee.sessionProvisioningStatus} />
          <ProvisioningChip label={t("brain")} status={employee.brainProvisioningStatus} />
        </div>

        <div className="flex flex-wrap gap-2">
          <EmployeeProviderBadge kind="Avatar" provider={employee.avatarProvider} />
          <EmployeeProviderBadge kind="Brain" provider={employee.brainProvider} />
          {employee.sessionVoiceProvider ? (
            <EmployeeProviderBadge
              kind="Voice"
              provider={employee.sessionVoiceProvider}
            />
          ) : null}
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
        {employee.xaiVoiceAvailable ? (
          authGateHref ? (
            <Button
              type="button"
              variant="outline"
              className="border-white/12 bg-transparent text-white hover:bg-white/5"
              asChild
            >
              <Link href={authGateHref}>
                <AudioLines className="mr-2 size-4" />
                {tCommon("voice")}
              </Link>
            </Button>
          ) : (
            <EmployeeGrokVoiceButton
              employeeId={employee.id}
              employeeName={employee.name}
              avatarPreviewUrl={employee.avatarPreviewUrl}
            />
          )
        ) : null}
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
