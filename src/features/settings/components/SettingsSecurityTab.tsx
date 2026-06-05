import type { SecuritySnapshot } from "../types";
import { SettingsCard } from "./settings-card";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export function SettingsSecurityTab({
  security,
}: {
  security: SecuritySnapshot;
}) {
  return (
    <div className="grid gap-6">
      <SettingsCard title="Authentication" description="Account and session security">
        <div className="grid gap-3">
          <StatusRow
            label="Two-Factor Authentication"
            value={security.twoFactorEnabled ? "Enabled" : "Managed in auth provider"}
          />
          <StatusRow
            label="Active Sessions"
            value={`${security.activeAuthSessions} device(s)`}
          />
          <StatusRow label="Session Timeout" value="30 minutes" />
        </div>
      </SettingsCard>
      <SettingsCard title="API Access">
        <div className="grid gap-3">
          <StatusRow
            label="API Keys"
            value={security.apiKeysConfigured ? "Configured" : "Not configured"}
          />
          <StatusRow label="IP Allowlist" value="Disabled" />
          <p className="text-xs text-muted-foreground">
            Programmatic API keys and allowlists will ship in a dedicated security release.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}
