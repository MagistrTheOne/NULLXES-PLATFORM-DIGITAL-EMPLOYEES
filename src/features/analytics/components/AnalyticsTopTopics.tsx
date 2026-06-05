"use client";

import { useTranslations } from "next-intl";
import type { TopicRow } from "../types";
import { AnalyticsCard } from "./analytics-card";

export function AnalyticsTopTopics({ topics }: { topics: TopicRow[] }) {
  const t = useTranslations("analytics.charts");

  return (
    <AnalyticsCard
      title={t("topTopics")}
      description={t("topTopicsDesc")}
      className="min-h-[320px]"
    >
      <div className="space-y-4 px-5 py-5">
        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noTopicsInPeriod")}</p>
        ) : (
          topics.map((topic) => (
            <div key={topic.topic} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{topic.topic}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {topic.sharePercent}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-white/70"
                  style={{ width: `${Math.max(topic.sharePercent, 4)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </AnalyticsCard>
  );
}
