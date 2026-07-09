"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWorkspacePermissions } from "@/features/workspace/components/workspace-permissions-provider";
import { useFormatOrganizationDate } from "@/features/workspace/components/workspace-display-preferences-provider";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { EmployeeListItem } from "../types";
import { EmployeeStatusBadge } from "./employee-status-badge";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EmployeeListView({
  employees,
}: {
  employees: EmployeeListItem[];
}) {
  const tActions = useTranslations("common.actions");
  const permissions = useWorkspacePermissions();
  const { formatDate } = useFormatOrganizationDate();

  return (
    <ul className="overflow-hidden rounded-2xl border border-white/8 bg-[#111111]">
      {employees.map((employee) => {
        const canTalk = employee.canTalk && permissions.canOperateEmployees;
        return (
          <li
            key={employee.id}
            className="border-b border-white/8 last:border-b-0"
          >
            <div className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="sm">
                  {employee.avatarPreviewUrl ? (
                    <AvatarImage
                      src={employee.avatarPreviewUrl}
                      alt={employee.name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-white/10 text-[10px] text-white/70">
                    {employee.avatarPreviewUrl ? null : (
                      <UserRound className="size-3.5" />
                    )}
                    {initials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/employees/${employee.id}`}
                    className="truncate text-sm font-medium text-white hover:text-white/80"
                  >
                    {employee.name}
                  </Link>
                  <p className="truncate text-xs text-white/50">
                    {employee.role}
                    {employee.department ? ` · ${employee.department}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <EmployeeStatusBadge status={employee.status} />
                <span className="hidden text-xs tabular-nums text-white/40 md:inline">
                  {formatDate(employee.createdAt)}
                </span>
                <Button
                  type="button"
                  disabled={!canTalk}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-white/70 hover:bg-white/5 hover:text-white disabled:opacity-40"
                  asChild={canTalk}
                >
                  {canTalk ? (
                    <Link href={`/dashboard/employees/${employee.id}/talk`}>
                      {tActions("talk")}
                    </Link>
                  ) : (
                    <span>{tActions("talk")}</span>
                  )}
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
