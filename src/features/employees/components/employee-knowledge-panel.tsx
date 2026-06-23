import { formatOrganizationDate } from "@/shared/i18n/format-organization-date";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeKnowledgeItem } from "../types";
import { EmployeeKnowledgeAddForm } from "./employee-knowledge-add-form";

export async function EmployeeKnowledgePanel({
  items,
  employeeId,
  canManage,
  displayPreferences,
}: {
  items: EmployeeKnowledgeItem[];
  employeeId: string;
  canManage: boolean;
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const t = await getTranslations("employees.knowledge");

  return (
    <div className="flex flex-col gap-4">
      <EmployeeKnowledgeAddForm employeeId={employeeId} canManage={canManage} />

      {items.length === 0 ? (
        <Card className="border-white/10 bg-[#111111] py-0 text-white">
          <CardContent className="px-5 py-8 text-sm text-white/50">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-[#111111] py-0 text-white">
          <CardHeader className="border-b border-white/10 px-5 py-4">
            <CardTitle className="text-base font-medium">
              {t("title", { count: items.length })}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-white/10 px-0 py-0">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs tracking-wide text-white/45 uppercase">
                    {item.type} · {t(`status.${item.status}`)}
                  </p>
                  {item.failureReason ? (
                    <p className="mt-2 text-xs text-white/55">
                      {item.failureReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-white/50 sm:items-end">
                  <span>{t("chunks", { count: item.chunkCount })}</span>
                  <span>
                    {formatOrganizationDate(item.createdAt, {
                      dateFormat: displayPreferences.dateFormat,
                      locale: displayPreferences.language,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
