import type { RecentLifecycleEventRow } from "@/features/analytics/types";
import { formatRelativeTime } from "../lib/format-relative-time";
import { OverviewCard } from "./overview-card";

function formatActivityMessage(event: RecentLifecycleEventRow): string {
  switch (event.eventType) {
    case "created":
      return `${event.employeeName} was created`;
    case "activated":
      return `${event.employeeName} was activated`;
    case "paused":
      return `${event.employeeName} was paused`;
    case "archived":
      return `${event.employeeName} was archived`;
    case "runtime_updated":
      return `${event.employeeName} runtime was updated`;
    case "knowledge_updated":
      return `${event.employeeName} knowledge was updated`;
    default:
      return `${event.employeeName} lifecycle event`;
  }
}

export function OverviewRecentActivity({
  events,
}: {
  events: RecentLifecycleEventRow[];
}) {
  return (
    <OverviewCard title="Recent Activity" description="Latest workspace events">
      <ul className="max-h-[360px] space-y-0 overflow-y-auto px-5 py-2">
        {events.length === 0 ? (
          <li className="py-10 text-center text-sm text-muted-foreground">
            No recent activity recorded yet.
          </li>
        ) : (
          events.map((event) => (
            <li
              key={event.id}
              className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  {formatActivityMessage(event)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.actorName}
                  {event.reason ? ` · ${event.reason}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(event.createdAt)}
              </span>
            </li>
          ))
        )}
      </ul>
    </OverviewCard>
  );
}
