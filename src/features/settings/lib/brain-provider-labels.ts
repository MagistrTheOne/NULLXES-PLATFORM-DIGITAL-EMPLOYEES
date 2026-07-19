import type { BrainProvider } from "@/entities/digital-employee";

export const BRAIN_PROVIDER_OPTIONS: Array<{
  value: BrainProvider;
  labelKey: string;
}> = [
  { value: "openai", labelKey: "brainOpenai" },
  { value: "anthropic", labelKey: "brainAnthropic" },
  { value: "google", labelKey: "brainGoogle" },
  { value: "nullxes", labelKey: "brainNullxes" },
  { value: "xai", labelKey: "brainXai" },
];

const BRAIN_LABEL_FALLBACK: Record<BrainProvider, string> = {
  openai: "OpenAI GPT-4.1",
  anthropic: "Anthropic Claude",
  google: "Google Gemini",
  nullxes: "NULLXES Brain",
  xai: "xAI Grok",
};

export function getBrainProviderLabel(provider: BrainProvider): string {
  return BRAIN_LABEL_FALLBACK[provider] ?? provider;
}
