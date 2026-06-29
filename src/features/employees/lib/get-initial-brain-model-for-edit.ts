import type { BrainProvider } from "@/entities/digital-employee";
import {
  getDefaultBrainModelForProvider,
  resolveBrainModelForProvider,
} from "@/features/settings/lib/brain-model-defaults";

export function getInitialBrainModelForEdit(
  provider: BrainProvider,
  configuredModel: string | null,
): string {
  return configuredModel?.trim()
    ? resolveBrainModelForProvider(provider, configuredModel)
    : getDefaultBrainModelForProvider(provider);
}
