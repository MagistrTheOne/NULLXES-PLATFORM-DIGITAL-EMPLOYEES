import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeHandoffItem } from "../types";
import { EmployeeHandoffActions } from "./employee-handoff-actions";

export async function EmployeeHandoffsPanel({
  items,
  canManage,
}: {
  items: EmployeeHandoffItem[];
  canManage: boolean;
}) {
  const t = await getTranslations("employees.detail.handoffs");

  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="border-b border-white/10 px-5 py-4">
        <CardTitle className="text-base font-medium">{t("title")}</CardTitle>
        <p className="text-sm text-white/50">{t("description")}</p>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {items.length === 0 ? (
          <p className="text-sm text-white/50">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <p className="text-sm text-white">{item.counterpartName}</p>
                <p className="mt-1 text-xs text-white/50">
                  {item.direction === "outgoing" ? t("outgoing") : t("incoming")}
                  {" · "}
                  {item.status}
                </p>
                {item.reason ? (
                  <p className="mt-2 text-sm text-white/60">{item.reason}</p>
                ) : null}
                <EmployeeHandoffActions handoff={item} canManage={canManage} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
