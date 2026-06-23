import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatOrganizationDate,
  formatOrganizationDateTime,
} from "@/shared/i18n/format-organization-date";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import type { EmployeeTaskItem } from "../services/get-employee-tasks";
import { parseEmployeeTaskResult } from "../lib/format-employee-task-result";

export async function EmployeeTasksPanel({
  items,
  displayPreferences,
}: {
  items: EmployeeTaskItem[];
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const t = await getTranslations("employees.tasks");

  if (items.length === 0) {
    return (
      <Card className="border-white/10 bg-[#111111] py-0 text-white">
        <CardContent className="px-5 py-8 text-sm text-white/50">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="border-b border-white/10 px-5 py-4">
        <CardTitle className="text-base font-medium">
          {t("title", { count: items.length })}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-white/10 px-0 py-0">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs tracking-wide text-white/45 uppercase">
                  {t(`source.${item.source}`)} · {t(`status.${item.status}`)}
                </p>
              </div>
              <span className="text-xs text-white/50">
                {formatOrganizationDate(item.createdAt, {
                  dateFormat: displayPreferences.dateFormat,
                  locale: displayPreferences.language,
                })}
              </span>
            </div>
            <p className="text-sm text-white/65">{item.description}</p>
            {item.dueAt ? (
              <p className="text-xs text-white/45">
                {t("dueAt")}{" "}
                {formatOrganizationDateTime(item.dueAt, {
                  dateFormat: displayPreferences.dateFormat,
                  timeFormat: displayPreferences.timeFormat,
                  locale: displayPreferences.language,
                })}
              </p>
            ) : null}
            {item.result ? (
              (() => {
                const parsed = parseEmployeeTaskResult(item.result);
                if (!parsed) {
                  return null;
                }

                return (
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-white/40">
                      {t("result")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-white/75">
                      {parsed.summary}
                    </p>
                    {parsed.artifacts && parsed.artifacts.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {parsed.artifacts.map((artifact) => (
                          <div
                            key={`${artifact.type}-${artifact.label}`}
                            className="rounded-md border border-white/8 bg-black/20 px-3 py-2"
                          >
                            <p className="text-xs uppercase tracking-wide text-white/40">
                              {artifact.label}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-white/70">
                              {artifact.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
