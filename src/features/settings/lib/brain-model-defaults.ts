import type { BrainProvider } from "@/entities/digital-employee";

export const BRAIN_MODEL_DEFAULTS: Record<BrainProvider, string> = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.0-flash",
  nullxes: "nullxes-brain-v1",
};

export function resolveBrainModelForProvider(
  provider: BrainProvider,
  configuredModel: string | null | undefined,
): string {
  const fallback = BRAIN_MODEL_DEFAULTS[provider];

  if (provider !== "openai") {
    return fallback;
  }

  const model = configuredModel?.trim();

  if (!model || !/^[a-z0-9.-]+$/i.test(model)) {
    return fallback;
  }

  return model;
}

export function getDefaultBrainModelForProvider(provider: BrainProvider): string {
  return BRAIN_MODEL_DEFAULTS[provider];
}
