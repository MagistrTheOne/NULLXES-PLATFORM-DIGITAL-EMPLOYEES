import { format } from "date-fns";
import type { RecentLifecycleEventRow } from "../types";
import { AnalyticsCard } from "./analytics-card";

export function AnalyticsRecentLifecycle({
  events,
}: {
  events: RecentLifecycleEventRow[];
}) {
  return (
    <AnalyticsCard title="Recent Activity" description="Lifecycle events">
      <div className="max-h-[320px] overflow-y-auto px-5 py-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No lifecycle events recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">{event.employeeName}</span>
                    <span className="text-muted-foreground/70"> · </span>
                    {event.eventType.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.reason ?? "No reason provided"} · {event.actorName}
                  </p>
                </div>
                <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {format(event.createdAt, "MMM d, HH:mm")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnalyticsCard>
  );
}
