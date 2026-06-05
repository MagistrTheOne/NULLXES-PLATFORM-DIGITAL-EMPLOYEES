import type { SystemStatusItem } from "@/features/overview/types";
import { SettingsCard } from "./settings-card";

function statusLabel(status: SystemStatusItem["status"]): string {
  switch (status) {
    case "operational":
      return "Connected";
    case "degraded":
      return "Degraded";
    case "unavailable":
      return "Not configured";
  }
}

export function SettingsIntegrationsTab({
  integrations,
}: {
  integrations: SystemStatusItem[];
}) {
  return (
    <SettingsCard
      title="Connected Services"
      description="Provider availability for this deployment"
    >
      <ul className="space-y-3">
        {integrations.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3"
          >
            <div>
              <p className="text-sm text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <span className="text-xs text-foreground/70">{statusLabel(item.status)}</span>
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}
