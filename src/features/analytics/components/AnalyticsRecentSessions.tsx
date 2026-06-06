"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFormatOrganizationDate } from "@/features/workspace/components/workspace-display-preferences-provider";
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

export function AnalyticsRecentSessions({
  sessions,
}: {
  sessions: RecentSessionRow[];
}) {
  const t = useTranslations("analytics.recent");
  const { formatDateTime } = useFormatOrganizationDate();

  return (
    <AnalyticsCard title={t("sessions")} description={t("sessionsDesc")}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">{t("employee")}</TableHead>
              <TableHead className="text-muted-foreground">{t("user")}</TableHead>
              <TableHead className="text-muted-foreground">{t("duration")}</TableHead>
              <TableHead className="text-muted-foreground">{t("messages")}</TableHead>
              <TableHead className="text-muted-foreground">{t("satisfaction")}</TableHead>
              <TableHead className="text-right text-muted-foreground">
                {t("startedAt")}
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
                  {t("emptySessions")}
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
                    {formatDateTime(session.startedAt)}
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
