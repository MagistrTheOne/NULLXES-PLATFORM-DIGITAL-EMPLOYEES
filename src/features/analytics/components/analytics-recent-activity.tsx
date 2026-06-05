import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityMetrics, RecentLifecycleEventRow } from "../types";

function ActivitySummary({ activity }: { activity: ActivityMetrics }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
        <p className="text-xs text-white/45">Created (7d)</p>
        <p className="mt-1 text-xl font-medium tabular-nums">
          {activity.createdEmployeesLast7Days}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
        <p className="text-xs text-white/45">Activated (7d)</p>
        <p className="mt-1 text-xl font-medium tabular-nums">
          {activity.activatedEmployeesLast7Days}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
        <p className="text-xs text-white/45">Archived (7d)</p>
        <p className="mt-1 text-xl font-medium tabular-nums">
          {activity.archivedEmployeesLast7Days}
        </p>
      </div>
    </div>
  );
}

export function AnalyticsRecentActivity({
  events,
  activity,
}: {
  events: RecentLifecycleEventRow[];
  activity: ActivityMetrics;
}) {
  return (
    <Card className="border-white/10 bg-[#111111] py-0 text-white">
      <CardHeader className="border-b border-white/10 px-5 py-4">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <ActivitySummary activity={activity} />
        {events.length === 0 ? (
          <p className="text-sm text-white/45">No lifecycle events recorded yet.</p>
        ) : (
          <div className="divide-y divide-white/10">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white">
                    <span className="text-white/55">{event.employeeName}</span>
                    <span className="text-white/35"> · </span>
                    {event.eventType.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {event.reason ?? "No reason provided"} · {event.actorName}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-white/45 tabular-nums">
                  {format(event.createdAt, "MMM d, yyyy HH:mm")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
