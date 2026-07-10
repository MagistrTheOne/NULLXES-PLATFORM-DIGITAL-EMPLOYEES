"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWorkspacePermissions } from "@/features/workspace/components/workspace-permissions-provider";
import { useFormatOrganizationDate } from "@/features/workspace/components/workspace-display-preferences-provider";
import { Button } from "@/components/ui/button";
import type { EmployeeListItem } from "../types";
import { EmployeeStatusBadge } from "./employee-status-badge";

export function EmployeeTableView({
  employees,
}: {
  employees: EmployeeListItem[];
}) {
  const t = useTranslations("employees.list");
  const tActions = useTranslations("common.actions");
  const permissions = useWorkspacePermissions();
  const { formatDate } = useFormatOrganizationDate();

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#111111]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[11px] uppercase tracking-wide text-white/35">
              <th className="px-4 py-2.5 font-normal">{t("colName")}</th>
              <th className="px-4 py-2.5 font-normal">{t("colRole")}</th>
              <th className="px-4 py-2.5 font-normal">{t("colDepartment")}</th>
              <th className="px-4 py-2.5 font-normal">{t("colStatus")}</th>
              <th className="px-4 py-2.5 font-normal">{t("colCreated")}</th>
              <th className="px-4 py-2.5 font-normal">
                <span className="sr-only">{t("colActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const canTalk =
                employee.canTalk && permissions.canOperateEmployees;
              return (
                <tr
                  key={employee.id}
                  className="border-b border-white/8 last:border-b-0 transition-colors hover:bg-white/3"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/employees/${employee.id}`}
                      className="font-medium text-white hover:text-white/80"
                    >
                      {employee.name}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-white/60">
                    {employee.role}
                  </td>
                  <td className="px-4 py-3 text-white/50">
                    {employee.department ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EmployeeStatusBadge status={employee.status} />
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-white/45">
                    {formatDate(employee.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        disabled={!canTalk}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-40"
                        asChild={canTalk}
                      >
                        {canTalk ? (
                          <Link
                            href={`/dashboard/employees/${employee.id}/talk`}
                          >
                            {tActions("talk")}
                          </Link>
                        ) : (
                          <span>{tActions("talk")}</span>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-white/70 hover:bg-white/5 hover:text-white"
                        asChild
                      >
                        <Link href={`/dashboard/employees/${employee.id}`}>
                          {t("view")}
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
