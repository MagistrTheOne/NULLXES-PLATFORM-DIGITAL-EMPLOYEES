"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAnalyticsRangeLabel } from "@/features/analytics/lib/date-range";
import type { AnalyticsDateRange } from "@/features/analytics/types";

export function OverviewHeader({
  range,
  onCreateClick,
  canCreate = true,
}: {
  range: AnalyticsDateRange;
  onCreateClick: () => void;
  canCreate?: boolean;
}) {
  const t = useTranslations("common.actions");
  const tNav = useTranslations("common.nav");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hidden text-xs text-muted-foreground lg:inline">
        {formatAnalyticsRangeLabel(range)}
      </span>
      <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
        <Link href="/dashboard/analytics">
          <BarChart3 className="size-4" />
          {tNav("analytics")}
        </Link>
      </Button>
      {canCreate ? (
        <Button type="button" onClick={onCreateClick}>
          <Plus className="size-4" />
          {t("createEmployee")}
        </Button>
      ) : null}
    </div>
  );
}
