import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatOrganizationDateTime,
} from "@/shared/i18n/format-organization-date";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import type { EmployeeDetailShell } from "../types";
import { getEmployeeOverviewSnapshot } from "../services/get-employee-overview-snapshot";
import { EmployeeProviderBadge } from "./employee-provider-badge";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="max-w-[60%] text-end text-sm text-white">{value}</span>
    </div>
  );
}

const MISSION_STATUS_CLASS: Record<string, string> = {
  planned: "border-white/15 bg-white/4 text-white/60",
  working: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  waiting_approval: "border-sky-500/30 bg-sky-500/10 text-sky-100",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  failed: "border-red-500/30 bg-red-500/10 text-red-200",
  cancelled: "border-white/10 bg-white/3 text-white/40",
};

export async function EmployeeOverviewTab({
  employee,
  organizationId,
  displayPreferences,
}: {
  employee: EmployeeDetailShell;
  organizationId: string;
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const t = await getTranslations("employees.detail");
  const tStatus = await getTranslations("employees.status");
  const tLifecycle = await getTranslations("employees.lifecycle");
  const tMissions = await getTranslations("employees.detail.overviewPanel");
  const snapshot = await getEmployeeOverviewSnapshot(organizationId, employee.id);

  return (
    <div className="mt-4 space-y-4">
      <Card className="border-white/10 bg-[#111111] py-0 text-white">
        <CardHeader className="border-b border-white/10 px-5 py-4">
          <CardTitle className="text-base font-medium">{t("overview")}</CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-2">
          <DetailRow label={t("status")} value={tStatus(employee.status)} />
          <DetailRow
            label={t("created")}
            value={formatOrganizationDateTime(employee.createdAt, {
              dateFormat: displayPreferences.dateFormat,
              timeFormat: displayPreferences.timeFormat,
              locale: displayPreferences.language,
            })}
          />
          <DetailRow
            label={t("knowledgeSources")}
            value={String(employee.knowledgeSourcesCount)}
          />
          <DetailRow
            label={tMissions("activeSkills")}
            value={String(snapshot.activeSkillsCount)}
          />
          {snapshot.characterPresetName ? (
            <DetailRow
              label={tMissions("characterPreset")}
              value={snapshot.characterPresetName}
            />
          ) : null}
          {employee.description ? (
            <DetailRow label={t("description")} value={employee.description} />
          ) : null}
          <div className="flex flex-wrap gap-2 py-3">
            <EmployeeProviderBadge kind="Avatar" provider={employee.avatarProvider} />
            <EmployeeProviderBadge kind="Brain" provider={employee.brainProvider} />
            {employee.sessionVoiceProvider ? (
              <EmployeeProviderBadge
                kind="Voice"
                provider={employee.sessionVoiceProvider}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-[#111111] py-0 text-white">
          <CardHeader className="border-b border-white/10 px-5 py-4">
            <CardTitle className="text-base font-medium">
              {tMissions("missionsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/10 bg-white/3 text-white/70">
                {tMissions("missionsTotal", { count: snapshot.missionsTotal })}
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              >
                {tMissions("missionsCompleted", {
                  count: snapshot.missionsCompleted,
                })}
              </Badge>
            </div>
            {snapshot.recentMissions.length === 0 ? (
              <p className="text-sm text-white/50">{tMissions("missionsEmpty")}</p>
            ) : (
              <ul className="space-y-3">
                {snapshot.recentMissions.map((mission) => (
                  <li
                    key={mission.id}
                    className="rounded-lg border border-white/8 bg-black/20 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/dashboard/missions/${mission.id}`}
                        className="text-sm font-medium text-white hover:underline"
                      >
                        {mission.title}
                      </Link>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 rounded-md font-normal capitalize",
                          MISSION_STATUS_CLASS[mission.status] ??
                            "border-white/10 text-white/60",
                        )}
                      >
                        {mission.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {formatOrganizationDateTime(mission.updatedAt, {
                        dateFormat: displayPreferences.dateFormat,
                        timeFormat: displayPreferences.timeFormat,
                        locale: displayPreferences.language,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111111] py-0 text-white">
          <CardHeader className="border-b border-white/10 px-5 py-4">
            <CardTitle className="text-base font-medium">
              {tLifecycle("title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4">
            {snapshot.recentLifecycle.length === 0 ? (
              <p className="text-sm text-white/50">{tLifecycle("empty")}</p>
            ) : (
              <ol className="relative border-s border-white/10 ps-6">
                {snapshot.recentLifecycle.map((item, index) => (
                  <li key={item.id} className={index > 0 ? "mt-5" : ""}>
                    <span className="absolute -inset-s-1.5 mt-1.5 size-3 rounded-full border border-white/20 bg-[#111111]" />
                    <p className="text-sm font-medium capitalize text-white">
                      {tLifecycle(`events.${item.eventType}`)}
                    </p>
                    <p className="text-xs text-white/50">
                      {item.actorName} ·{" "}
                      {formatOrganizationDateTime(item.createdAt, {
                        dateFormat: displayPreferences.dateFormat,
                        timeFormat: displayPreferences.timeFormat,
                        locale: displayPreferences.language,
                      })}
                    </p>
                    {item.reason ? (
                      <p className="mt-1 text-sm text-white/60">{item.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
