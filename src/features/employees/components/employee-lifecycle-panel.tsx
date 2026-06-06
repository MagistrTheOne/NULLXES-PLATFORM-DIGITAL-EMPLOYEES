import {
  formatOrganizationDateTime,
} from "@/shared/i18n/format-organization-date";
import type { OrganizationDisplayPreferences } from "@/features/workspace/types/display-preferences";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeLifecycleItem } from "../types";

export async function EmployeeLifecyclePanel({
  items,
  displayPreferences,
}: {
  items: EmployeeLifecycleItem[];
  displayPreferences: OrganizationDisplayPreferences;
}) {
  const t = await getTranslations("employees.lifecycle");

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
        <CardTitle className="text-base font-medium">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <ol className="relative border-s border-white/10 ps-6">
          {items.map((item, index) => (
            <li key={item.id} className={index > 0 ? "mt-6" : ""}>
              <span className="absolute -start-1.5 mt-1.5 size-3 rounded-full border border-white/20 bg-[#111111]" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-white capitalize">
                  {t(`events.${item.eventType}`)}
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
                  <p className="text-sm text-white/60">{item.reason}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
