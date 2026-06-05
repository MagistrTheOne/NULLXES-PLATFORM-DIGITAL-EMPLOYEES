import type { OrganizationProfileDto } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsBillingTab({
  organization,
}: {
  organization: OrganizationProfileDto;
}) {
  const planLabel =
    organization.type === "enterprise"
      ? "Enterprise"
      : organization.type === "government"
        ? "Government"
        : "Demo";

  return (
    <div className="grid gap-6">
      <SettingsCard title="Current Plan" description="Workspace subscription tier">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/40 px-4 py-4">
            <p className="text-2xl font-medium text-foreground">{planLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Managed billing and invoices are not connected yet.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Unlimited digital employees</li>
            <li>Workspace analytics and audit trail</li>
            <li>Knowledge indexing and session retention controls</li>
          </ul>
        </div>
      </SettingsCard>
      <SettingsCard title="Payment Methods">
        <p className="text-sm text-muted-foreground">
          Stripe billing integration is planned for a later phase. Contact your
          account team to change plan limits.
        </p>
      </SettingsCard>
    </div>
  );
}
