import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDurationSeconds } from "../lib/format-duration";
import type { TopEmployeeRow } from "../types";

export function AnalyticsTopEmployeesPanel({
  employees,
}: {
  employees: TopEmployeeRow[];
}) {
  const maxSessions = employees[0]?.totalSessions ?? 0;

  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="border-b border-white/10 px-5 py-4">
        <CardTitle className="text-base font-medium">Top Employees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-5 py-5">
        {employees.length === 0 ? (
          <p className="text-sm text-white/45">No employees in this workspace yet.</p>
        ) : (
          employees.map((employee, index) => {
            const widthPercent =
              maxSessions > 0
                ? Math.max(8, (employee.totalSessions / maxSessions) * 100)
                : 8;

            return (
              <div key={employee.employeeId} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/employees/${employee.employeeId}`}
                      className="truncate font-medium text-white hover:text-white/80"
                    >
                      {index + 1}. {employee.name}
                    </Link>
                    <p className="text-xs text-white/45">
                      {employee.totalSessions} sessions ·{" "}
                      {formatDurationSeconds(employee.totalDurationSeconds)}
                    </p>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-white/70"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
