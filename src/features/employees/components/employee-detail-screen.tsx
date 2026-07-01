import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrainProviderReadinessMap } from "@/features/brain/lib/brain-provider-readiness";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import {
  formatOrganizationDate,
} from "@/shared/i18n/format-organization-date";
import { resolveTalkReadinessBlockers } from "../lib/resolve-talk-readiness";
import { isAnamAvatarTalkReady } from "../lib/resolve-anam-avatar-talk-readiness";
import type { EmployeeDetailShell } from "../types";
import { AvatarIdlePreview } from "./avatar-idle-preview";
import { EmployeeDetailTabs, TabsContent } from "./employee-detail-tabs";
import { EmployeeDetailKnowledgeTab } from "./employee-detail-knowledge-tab";
import { EmployeeDetailLifecycleTab } from "./employee-detail-lifecycle-tab";
import { EmployeeDetailTasksTab } from "./employee-detail-tasks-tab";
import { EmployeeProviderBadge } from "./employee-provider-badge";
import { EmployeeDetailActions } from "./employee-detail-actions";
import { EmployeeStatusBadge } from "./employee-status-badge";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="max-w-[60%] text-end text-sm text-white">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="border-b border-white/10 px-5 py-4">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-2">{children}</CardContent>
    </Card>
  );
}

function TabPanelSkeleton() {
  return (
    <div className="mt-4 h-64 animate-pulse rounded-xl border border-white/10 bg-white/3" />
  );
}

export async function EmployeeDetailScreen({
  employee,
  organizationId,
  displayPreferences,
}: {
  employee: EmployeeDetailShell;
  organizationId: string;
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const t = await getTranslations("employees.detail");
  const tCommon = await getTranslations("common.actions");
  const tStatus = await getTranslations("employees.status");
  const empty = "—";
  const brainProviderReadiness = getBrainProviderReadinessMap();

  const isProvisioning =
    employee.avatarProvisioningStatus === "pending" ||
    employee.avatarProvisioningStatus === "provisioning";
  const showPreview =
    employee.avatarPreviewUrl && employee.avatarProvisioningStatus === "ready";

  const provisioningFailed =
    employee.avatarProvisioningStatus === "failed" ||
    employee.sessionProvisioningStatus === "failed" ||
    employee.brainProvisioningStatus === "failed";

  const talkBlockers = resolveTalkReadinessBlockers({
    avatarProvisioningStatus: employee.avatarProvisioningStatus,
    sessionProvisioningStatus: employee.sessionProvisioningStatus,
    avatarReady: isAnamAvatarTalkReady({
      provisioningStatus: employee.avatarProvisioningStatus,
      personaId: employee.personaId ?? undefined,
      avatarId: employee.avatarId ?? undefined,
    }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <Button
            variant="ghost"
            className="text-white/60 hover:bg-white/5 hover:text-white"
            asChild
          >
            <Link href="/dashboard/employees">
              <ArrowLeft className="size-4" />
              {tCommon("back")}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white">
              {employee.name}
            </h1>
            <p className="mt-1 text-sm text-white/60">{employee.role}</p>
          </div>
        </div>
        <EmployeeDetailActions
          employee={employee}
          brainProviderReadiness={brainProviderReadiness}
        />
      </div>

      {provisioningFailed ? (
        <div
          className="rounded-xl border border-white/12 bg-white/4 px-4 py-3 text-sm text-white/75"
          role="alert"
        >
          <p>{t("provisioningFailedBanner")}</p>
          {employee.avatarProvisioningFailureReason ? (
            <p className="mt-1 text-xs text-white/50">
              {t("avatarFailure", {
                reason: employee.avatarProvisioningFailureReason,
              })}
            </p>
          ) : null}
          {employee.sessionProvisioningFailureReason ? (
            <p className="mt-1 text-xs text-white/50">
              {t("sessionFailure", {
                reason: employee.sessionProvisioningFailureReason,
              })}
            </p>
          ) : null}
          {employee.brainProvisioningFailureReason ? (
            <p className="mt-1 text-xs text-white/50">
              {t("brainFailure", {
                reason: employee.brainProvisioningFailureReason,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr] xl:items-start">
        <Card className="overflow-hidden border-white/10 bg-[#111111] py-0 text-white xl:sticky xl:top-6">
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
            <EmployeeStatusBadge status={employee.status} />
            <Button
              type="button"
              disabled={!employee.canTalk}
              className="bg-white text-black hover:bg-white/90 disabled:opacity-40"
              asChild={employee.canTalk}
            >
              {employee.canTalk ? (
                <Link href={`/dashboard/employees/${employee.id}/talk`}>
                  {tCommon("talk")}
                </Link>
              ) : (
                <span>{tCommon("talk")}</span>
              )}
            </Button>
            {!employee.canTalk ? (
              <div className="space-y-1 text-xs text-white/45">
                <p>{t("talkLocked")}</p>
                {talkBlockers.map((blocker) => (
                  <p key={blocker}>{t(`talkBlocker.${blocker}`)}</p>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <EmployeeDetailTabs>
          <TabsContent value="overview" className="mt-4">
            <SectionCard title={t("overview")}>
              <DetailRow
                label={t("status")}
                value={tStatus(employee.status)}
              />
              <DetailRow
                label={t("created")}
                value={formatOrganizationDate(employee.createdAt, {
                  dateFormat: displayPreferences.dateFormat,
                  locale: displayPreferences.language,
                })}
              />
              <DetailRow
                label={t("knowledgeSources")}
                value={String(employee.knowledgeSourcesCount)}
              />
              {employee.description ? (
                <DetailRow label={t("description")} value={employee.description} />
              ) : null}
              <div className="flex flex-wrap gap-2 py-3">
                <EmployeeProviderBadge
                  kind="Avatar"
                  provider={employee.avatarProvider}
                />
                <EmployeeProviderBadge
                  kind="Brain"
                  provider={employee.brainProvider}
                />
                {employee.sessionVoiceProvider ? (
                  <EmployeeProviderBadge
                    kind="Voice"
                    provider={employee.sessionVoiceProvider}
                  />
                ) : null}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="avatar" className="mt-4">
            <SectionCard title={t("avatar")}>
              <DetailRow
                label={t("provisioning")}
                value={employee.avatarProvisioningStatus}
              />
              <DetailRow
                label={t("avatarId")}
                value={employee.avatarId ?? empty}
              />
              <DetailRow
                label={t("personaId")}
                value={employee.personaId ?? empty}
              />
              <DetailRow
                label={t("anamKeySlot")}
                value={
                  employee.anamApiKeySlot ??
                  t("anamKeySlotDefault")
                }
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="voice" className="mt-4">
            <SectionCard title={t("voice")}>
              <DetailRow
                label={t("provisioning")}
                value={employee.sessionProvisioningStatus}
              />
              <DetailRow
                label={t("voiceBinding")}
                value={employee.voiceBinding ?? empty}
              />
              <DetailRow
                label={t("studioVoice")}
                value={employee.studioVoiceId ?? empty}
              />
              <DetailRow
                label={t("voiceId")}
                value={employee.voiceId ?? empty}
              />
              <DetailRow
                label={t("anamPersonaVoiceId")}
                value={employee.anamVoiceId ?? empty}
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="brain" className="mt-4">
            <SectionCard title={t("brain")}>
              <DetailRow
                label={t("provisioning")}
                value={employee.brainProvisioningStatus}
              />
              <DetailRow
                label={t("model")}
                value={employee.brainModel ?? empty}
              />
              <DetailRow
                label={t("systemPrompt")}
                value={
                  employee.systemPrompt.length > 240
                    ? `${employee.systemPrompt.slice(0, 240)}…`
                    : employee.systemPrompt
                }
              />
            </SectionCard>
          </TabsContent>

          <TabsContent value="knowledge" className="mt-4">
            <Suspense fallback={<TabPanelSkeleton />}>
              <EmployeeDetailKnowledgeTab
                organizationId={organizationId}
                employeeId={employee.id}
                displayPreferences={displayPreferences}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Suspense fallback={<TabPanelSkeleton />}>
              <EmployeeDetailTasksTab
                organizationId={organizationId}
                employeeId={employee.id}
                displayPreferences={displayPreferences}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="lifecycle" className="mt-4">
            <Suspense fallback={<TabPanelSkeleton />}>
              <EmployeeDetailLifecycleTab
                organizationId={organizationId}
                employeeId={employee.id}
                displayPreferences={displayPreferences}
              />
            </Suspense>
          </TabsContent>
        </EmployeeDetailTabs>
      </div>
    </div>
  );
}
