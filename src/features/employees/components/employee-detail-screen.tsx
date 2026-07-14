import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isPlatformAdminEmail } from "@/features/admin";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { getBrainProviderReadinessMap } from "@/features/brain/lib/brain-provider-readiness";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { resolveTalkReadinessBlockers } from "../lib/resolve-talk-readiness";
import { isAnamAvatarTalkReady } from "../lib/resolve-anam-avatar-talk-readiness";
import type { EmployeeDetailShell } from "../types";
import { EmployeeDetailTabs, TabsContent } from "./employee-detail-tabs";
import { EmployeeDetailKnowledgeTab } from "./employee-detail-knowledge-tab";
import { EmployeeDetailLifecycleTab } from "./employee-detail-lifecycle-tab";
import { EmployeeDetailTasksTab } from "./employee-detail-tasks-tab";
import { EmployeeBlueprintTabs } from "@/features/agent-blueprint/components/employee-blueprint-tabs";
import { EmployeeCustomizationPanel } from "./employee-customization-panel";
import { EmployeeDetailActions } from "./employee-detail-actions";
import { EmployeeOverviewTab } from "./employee-overview-tab";
import { EmployeePreviewRail } from "./employee-preview-rail";

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
  const session = await getCurrentSession();
  const isPlatformAdmin = isPlatformAdminEmail(session?.user.email);
  const empty = "—";
  const brainProviderReadiness = getBrainProviderReadinessMap();

  const provisioningFailed =
    employee.avatarProvisioningStatus === "failed" ||
    employee.sessionProvisioningStatus === "failed" ||
    employee.brainProvisioningStatus === "failed";

  const talkBlockers = resolveTalkReadinessBlockers({
    avatarProvisioningStatus: employee.avatarProvisioningStatus,
    sessionProvisioningStatus: employee.sessionProvisioningStatus,
    // Operators receive redacted avatar/persona IDs — readiness uses status + preview.
    avatarReady: isPlatformAdmin
      ? isAnamAvatarTalkReady({
          provisioningStatus: employee.avatarProvisioningStatus,
          personaId: employee.personaId ?? undefined,
          avatarId: employee.avatarId ?? undefined,
          previewUrl: employee.avatarPreviewUrl ?? undefined,
          providerMetadata: {
            anamPersonaVoiceId:
              employee.anamVoiceId ?? employee.voiceId ?? undefined,
            voiceId: employee.voiceId ?? undefined,
          },
        })
      : employee.avatarProvisioningStatus === "ready" &&
        Boolean(employee.avatarPreviewUrl),
  });

  const employeeForClient: EmployeeDetailShell = isPlatformAdmin
    ? employee
    : {
        ...employee,
        anamApiKeySlot: null,
        avatarId: null,
        personaId: null,
        anamVoiceId: null,
        voiceId: null,
        studioVoiceId: null,
        voiceBinding: null,
        avatarProvisioningFailureReason: null,
        sessionProvisioningFailureReason: null,
        brainProvisioningFailureReason: null,
      };

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
          employee={employeeForClient}
          brainProviderReadiness={brainProviderReadiness}
          isPlatformAdmin={isPlatformAdmin}
        />
      </div>

      {provisioningFailed ? (
        <div
          className="rounded-xl border border-white/12 bg-white/4 px-4 py-3 text-sm text-white/75"
          role="alert"
        >
          <p>{t("provisioningFailedBanner")}</p>
          {isPlatformAdmin && employee.avatarProvisioningFailureReason ? (
            <p className="mt-1 text-xs text-white/50">
              {t("avatarFailure", {
                reason: employee.avatarProvisioningFailureReason,
              })}
            </p>
          ) : null}
          {isPlatformAdmin && employee.sessionProvisioningFailureReason ? (
            <p className="mt-1 text-xs text-white/50">
              {t("sessionFailure", {
                reason: employee.sessionProvisioningFailureReason,
              })}
            </p>
          ) : null}
          {isPlatformAdmin && employee.brainProvisioningFailureReason ? (
            <p className="mt-1 text-xs text-white/50">
              {t("brainFailure", {
                reason: employee.brainProvisioningFailureReason,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr] xl:items-start">
        <EmployeePreviewRail
          employee={employeeForClient}
          displayPreferences={displayPreferences}
          talkBlockers={talkBlockers}
        />

        <EmployeeDetailTabs>
          <TabsContent value="overview">
            <Suspense fallback={<TabPanelSkeleton />}>
              <EmployeeOverviewTab
                employee={employeeForClient}
                organizationId={organizationId}
                displayPreferences={displayPreferences}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="customization" className="mt-0">
            <EmployeeCustomizationPanel
              employeeId={employee.id}
              employeeName={employee.name}
            />
          </TabsContent>

          <TabsContent value="avatar" className="mt-4">
            <SectionCard title={t("avatar")}>
              <DetailRow
                label={t("provisioning")}
                value={employee.avatarProvisioningStatus}
              />
              {isPlatformAdmin ? (
                <>
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
                      employee.anamApiKeySlot ?? t("anamKeySlotDefault")
                    }
                  />
                </>
              ) : null}
            </SectionCard>
          </TabsContent>

          <TabsContent value="voice" className="mt-4">
            <SectionCard title={t("voice")}>
              <DetailRow
                label={t("provisioning")}
                value={employee.sessionProvisioningStatus}
              />
              {isPlatformAdmin ? (
                <>
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
                </>
              ) : null}
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

          <TabsContent value="character" className="mt-4">
            <Suspense fallback={<TabPanelSkeleton />}>
              <EmployeeBlueprintTabs
                organizationId={organizationId}
                employeeId={employee.id}
                tab="character"
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <Suspense fallback={<TabPanelSkeleton />}>
              <EmployeeBlueprintTabs
                organizationId={organizationId}
                employeeId={employee.id}
                tab="skills"
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <Suspense fallback={<TabPanelSkeleton />}>
              <EmployeeBlueprintTabs
                organizationId={organizationId}
                employeeId={employee.id}
                tab="tools"
              />
            </Suspense>
          </TabsContent>
        </EmployeeDetailTabs>
      </div>
    </div>
  );
}
