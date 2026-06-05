import { getBrainProviderLabel } from "../lib/brain-provider-labels";
import type { OrganizationSettingsDto } from "../types";
import { SettingsCard } from "./settings-card";

export function SettingsAiTab({
  settings,
}: {
  settings: OrganizationSettingsDto;
}) {
  return (
    <SettingsCard
      title="AI Configuration"
      description="LLM defaults for new digital employees"
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3">
          <span className="text-muted-foreground">Default LLM</span>
          <span className="text-foreground">
            {getBrainProviderLabel(settings.defaultBrainProvider)}
          </span>
        </div>
        <p className="text-muted-foreground">
          Voice and avatar providers are provisioned per employee during creation
          and are not managed in workspace settings.
        </p>
        <p className="text-muted-foreground">
          Update the default LLM under General → Default Employee Settings.
        </p>
      </div>
    </SettingsCard>
  );
}
