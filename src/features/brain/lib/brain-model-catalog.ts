import type { BrainProvider } from "@/entities/digital-employee";

export type BrainModelCatalogOption = {
  id: string;
  label: string;
  groupKey?: string;
  pricingLabel?: string | null;
};

export const BRAIN_PROVIDERS: BrainProvider[] = [
  "openai",
  "anthropic",
  "google",
  "nullxes",
];

const CURATED_MODELS: Record<
  Exclude<BrainProvider, "openai">,
  BrainModelCatalogOption[]
> = {
  anthropic: [
    {
      id: "claude-sonnet-4-20250514",
      label: "Claude Sonnet 4",
      groupKey: "recommended",
    },
    {
      id: "claude-3-5-sonnet-20241022",
      label: "Claude 3.5 Sonnet",
      groupKey: "balanced",
    },
    {
      id: "claude-3-5-haiku-20241022",
      label: "Claude 3.5 Haiku",
      groupKey: "fast",
    },
  ],
  google: [
    {
      id: "gemini-2.0-flash",
      label: "Gemini 2.0 Flash",
      groupKey: "recommended",
    },
    {
      id: "gemini-2.5-pro-preview-05-06",
      label: "Gemini 2.5 Pro",
      groupKey: "balanced",
    },
    {
      id: "gemini-2.0-flash-lite",
      label: "Gemini 2.0 Flash Lite",
      groupKey: "fast",
    },
  ],
  nullxes: [
    {
      id: "nullxes-brain-v1",
      label: "NULLXES Brain v1",
      groupKey: "managed",
    },
  ],
};

export function getCuratedBrainModels(
  provider: Exclude<BrainProvider, "openai">,
): BrainModelCatalogOption[] {
  return CURATED_MODELS[provider];
}

export function getCuratedBrainModelIds(
  provider: Exclude<BrainProvider, "openai">,
): string[] {
  return CURATED_MODELS[provider].map((model) => model.id);
}

export function isCuratedBrainModel(
  provider: BrainProvider,
  modelId: string,
): boolean {
  if (provider === "openai") {
    return /^[a-z0-9.-]+$/i.test(modelId.trim());
  }

  return getCuratedBrainModelIds(provider).includes(modelId.trim());
}
