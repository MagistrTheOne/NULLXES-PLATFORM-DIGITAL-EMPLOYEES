import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatClockDuration } from "../lib/format-clock-duration";
import type { SessionMetrics, TopEmployeeRow } from "../types";
import { AnalyticsCard } from "./analytics-card";

export function AnalyticsRecentSessions({
  employees,
  sessions,
}: {
  employees: TopEmployeeRow[];
  sessions: SessionMetrics;
}) {
  const rows = employees.filter((employee) => employee.totalSessions > 0);

  return (
    <AnalyticsCard
      title="Recent Sessions"
      description="Employee session totals from workspace records"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Employee</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-right text-muted-foreground">
                Created
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {sessions.totalSessions === 0
                    ? "No sessions recorded for this workspace yet."
                    : "No employee session totals available."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((employee) => (
                <TableRow key={employee.employeeId} className="border-border">
                  <TableCell>
                    <Link
                      href={`/dashboard/employees/${employee.employeeId}`}
                      className="font-medium text-foreground hover:text-foreground/80"
                    >
                      {employee.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.totalSessions} recorded
                  </TableCell>
                  <TableCell className="tabular-nums text-foreground">
                    {formatClockDuration(employee.totalDurationSeconds)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AnalyticsCard>
  );
}
