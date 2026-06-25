"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecentLifecycleEventRow } from "@/features/analytics/types";
import type { OvernightWorkEventRow } from "@/features/overview/queries/get-overnight-work-events";
import type { LiveSessionRow } from "../types";
import { OverviewRecentActivity } from "./OverviewRecentActivity";
import { OverviewLiveSessions } from "./OverviewLiveSessions";
import { OverviewOvernightWork } from "./OverviewOvernightWork";

export function OverviewSecondaryPanels({
  recentActivity,
  liveSessions,
  overnightWork,
}: {
  recentActivity: RecentLifecycleEventRow[];
  liveSessions: LiveSessionRow[];
  overnightWork: OvernightWorkEventRow[];
}) {
  const t = useTranslations("dashboard.panels");

  return (
    <Tabs defaultValue="activity" className="w-full gap-3">
      <TabsList className="h-9 w-full justify-start gap-1 rounded-lg border border-border bg-card p-1 sm:w-auto">
        <TabsTrigger
          value="activity"
          className="rounded-md px-3 text-xs text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-foreground"
        >
          {t("activity")}
        </TabsTrigger>
        <TabsTrigger
          value="live"
          className="rounded-md px-3 text-xs text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-foreground"
        >
          {t("live")}
          {liveSessions.length > 0 ? (
            <span className="ml-1.5 tabular-nums text-foreground/70">
              {liveSessions.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger
          value="overnight"
          className="rounded-md px-3 text-xs text-muted-foreground data-[state=active]:bg-white/8 data-[state=active]:text-foreground"
        >
          {t("overnight")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="activity" className="mt-0">
        <OverviewRecentActivity events={recentActivity} embedded />
      </TabsContent>
      <TabsContent value="live" className="mt-0">
        <OverviewLiveSessions sessions={liveSessions} embedded />
      </TabsContent>
      <TabsContent value="overnight" className="mt-0">
        <OverviewOvernightWork events={overnightWork} embedded />
      </TabsContent>
    </Tabs>
  );
}
