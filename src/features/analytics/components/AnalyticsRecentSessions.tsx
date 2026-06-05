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
import type { RecentSessionRow } from "../types";
import { AnalyticsCard } from "./analytics-card";

function formatSatisfaction(rating: number | null): string {
  if (rating === null) {
    return "—";
  }

  return `${rating.toFixed(1)} / 5`;
}

function formatStartedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function AnalyticsRecentSessions({
  sessions,
}: {
  sessions: RecentSessionRow[];
}) {
  return (
    <AnalyticsCard
      title="Recent Sessions"
      description="Latest conversations in the selected period"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Employee</TableHead>
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Messages</TableHead>
              <TableHead className="text-muted-foreground">Satisfaction</TableHead>
              <TableHead className="text-right text-muted-foreground">
                Started At
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No sessions recorded for this period yet.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id} className="border-border">
                  <TableCell>
                    <Link
                      href={`/dashboard/employees/${session.employeeId}`}
                      className="font-medium text-foreground hover:text-foreground/80"
                    >
                      {session.employeeName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.userEmail}
                  </TableCell>
                  <TableCell className="tabular-nums text-foreground">
                    {session.durationSeconds
                      ? formatClockDuration(session.durationSeconds)
                      : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums text-foreground">
                    {session.messageCount}
                  </TableCell>
                  <TableCell className="tabular-nums text-foreground">
                    {formatSatisfaction(session.satisfactionRating)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatStartedAt(session.startedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AnalyticsCard>
  );
}
