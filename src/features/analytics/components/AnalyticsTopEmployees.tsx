import Link from "next/link";
import { UserRound } from "lucide-react";
import { formatDurationSeconds } from "../lib/format-duration";
import type { TopEmployeeRow } from "../types";
import { AnalyticsCard } from "./analytics-card";

function EmployeeAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium text-foreground">
      {initials || <UserRound className="size-4 text-muted-foreground" />}
    </div>
  );
}

export function AnalyticsTopEmployees({
  employees,
}: {
  employees: TopEmployeeRow[];
}) {
  const maxSessions = employees[0]?.totalSessions ?? 0;

  return (
    <AnalyticsCard
      title="Top Employees"
      description="Ranked by total sessions"
      className="min-h-[280px] 2xl:min-h-[420px]"
    >
      <div className="flex max-h-[360px] flex-col overflow-y-auto px-5 py-4 2xl:max-h-none 2xl:min-h-[calc(420px-57px)]">
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees in this workspace.</p>
        ) : (
          <div className="space-y-4">
            {employees.map((employee, index) => {
              const widthPercent =
                maxSessions > 0
                  ? Math.max(6, (employee.totalSessions / maxSessions) * 100)
                  : 6;

              return (
                <div key={employee.employeeId} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar name={employee.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/dashboard/employees/${employee.employeeId}`}
                          className="truncate text-sm font-medium text-foreground hover:text-foreground/80"
                        >
                          {index + 1}. {employee.name}
                        </Link>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {employee.totalSessions} sessions
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDurationSeconds(employee.totalDurationSeconds)} conversation
                        time
                      </p>
                    </div>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/80"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AnalyticsCard>
  );
}
