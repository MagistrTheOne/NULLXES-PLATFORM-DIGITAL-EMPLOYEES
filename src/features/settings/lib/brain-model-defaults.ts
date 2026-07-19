import type { BrainProvider } from "@/entities/digital-employee";
import {
  getCuratedBrainModelIds,
  isCuratedBrainModel,
} from "@/features/brain/lib/brain-model-catalog";

export const BRAIN_MODEL_DEFAULTS: Record<BrainProvider, string> = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.0-flash",
  nullxes: "MagistrTheOne/SHUTEN-DOJI",
  xai: "grok-4.5",
};

export function resolveBrainModelForProvider(
  provider: BrainProvider,
  configuredModel: string | null | undefined,
): string {
  const fallback = BRAIN_MODEL_DEFAULTS[provider];
  const model = configuredModel?.trim();

  if (!model) {
    return fallback;
  }

  if (provider === "openai") {
    if (!/^[a-z0-9.-]+$/i.test(model)) {
      return fallback;
    }

    return model;
  }

  if (isCuratedBrainModel(provider, model)) {
    return model;
  }

  const curatedIds = getCuratedBrainModelIds(provider);
  if (curatedIds.includes(model)) {
    return model;
  }

  return fallback;
}

export function getDefaultBrainModelForProvider(provider: BrainProvider): string {
  return BRAIN_MODEL_DEFAULTS[provider];
}
