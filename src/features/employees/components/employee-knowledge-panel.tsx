import { formatOrganizationDate } from "@/shared/i18n/format-organization-date";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import type { EmployeeKnowledgeItem } from "../types";
import { EmployeeKnowledgeAddForm } from "./employee-knowledge-add-form";
import { EmployeeKnowledgeCollapsible } from "./employee-knowledge-collapsible";

export async function EmployeeKnowledgePanel({
  items,
  employeeId,
  canManage,
  displayPreferences,
  isPlatformAdmin = false,
}: {
  items: EmployeeKnowledgeItem[];
  employeeId: string;
  canManage: boolean;
  displayPreferences: OrganizationDisplayPreferences;
  isPlatformAdmin?: boolean;
}) {
  const t = await getTranslations("employees.knowledge");

  return (
    <EmployeeKnowledgeCollapsible count={items.length}>
      <div className="flex flex-col gap-4">
        <EmployeeKnowledgeAddForm employeeId={employeeId} canManage={canManage} />

        {items.length === 0 ? (
          <Card className="border-white/10 bg-black/20 py-0 text-white">
            <CardContent className="px-4 py-6 text-sm text-white/50">
              {t("empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-black/20">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {isPlatformAdmin ? (
                      <>
                        {t(`type.${item.type}`)} ·{" "}
                      </>
                    ) : null}
                    {t(`status.${item.status}`)}
                  </p>
                  {item.failureReason ? (
                    <p className="mt-2 text-xs text-white/55">
                      {item.failureReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-white/50 sm:items-end">
                  {isPlatformAdmin ? (
                    <span>{t("chunks", { count: item.chunkCount })}</span>
                  ) : null}
                  <span>
                    {formatOrganizationDate(item.createdAt, {
                      dateFormat: displayPreferences.dateFormat,
                      locale: displayPreferences.language,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployeeKnowledgeCollapsible>
  );
}
