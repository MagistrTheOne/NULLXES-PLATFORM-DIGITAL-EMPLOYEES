"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLiveDuration, formatRelativeTime } from "../lib/format-relative-time";
import type { LiveSessionRow } from "../types";
import { OverviewCard } from "./overview-card";

function LiveDurationCell({ startedAt }: { startedAt: Date }) {
  const [duration, setDuration] = useState(() =>
    formatLiveDuration(startedAt),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDuration(formatLiveDuration(startedAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [startedAt]);

  return <span className="tabular-nums text-foreground">{duration}</span>;
}

export function OverviewLiveSessions({
  sessions,
}: {
  sessions: LiveSessionRow[];
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard.sessions");

  return (
    <OverviewCard
      title={t("title")}
      description={t("description")}
      className="min-h-[360px]"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">{t("employee")}</TableHead>
              <TableHead className="text-muted-foreground">{t("user")}</TableHead>
              <TableHead className="text-muted-foreground">{t("duration")}</TableHead>
              <TableHead className="text-muted-foreground">{t("status")}</TableHead>
              <TableHead className="text-right text-muted-foreground">
                {t("started")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
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
                  <TableCell>
                    <LiveDurationCell startedAt={session.startedAt} />
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
                      {t("live")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatRelativeTime(session.startedAt, locale)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </OverviewCard>
  );
}
