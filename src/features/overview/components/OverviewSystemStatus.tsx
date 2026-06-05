import type { SystemStatusItem, SystemStatusState } from "../types";
import { OverviewCard } from "./overview-card";

function statusLabel(status: SystemStatusState): string {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "unavailable":
      return "Unavailable";
  }
}

export function OverviewSystemStatus({
  items,
}: {
  items: SystemStatusItem[];
}) {
  const allOperational = items.every((item) => item.status === "operational");

  return (
    <OverviewCard
      title="System Status"
      description={
        allOperational ? "All systems operational" : "Some services need attention"
      }
    >
      <ul className="space-y-3 px-5 py-5">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-foreground/70">
              {statusLabel(item.status)}
            </span>
          </li>
        ))}
      </ul>
    </OverviewCard>
  );
}
