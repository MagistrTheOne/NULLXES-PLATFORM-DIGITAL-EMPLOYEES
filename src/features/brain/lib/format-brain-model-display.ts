import type { BrainProvider } from "@/entities/digital-employee";

const SHUTEN_DISPLAY_LABEL = "SHUTEN-DŌJI · NULLXES";

export function formatBrainModelDisplay(input: {
  provider: BrainProvider;
  modelId: string;
}): string {
  if (input.provider === "nullxes") {
    return SHUTEN_DISPLAY_LABEL;
  }

  return input.modelId.trim() || input.provider;
}

export function isShutenBrainProvider(provider: BrainProvider): boolean {
  return provider === "nullxes";
}
