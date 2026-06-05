import type { BrainProvider } from "@/entities/digital-employee";

export const BRAIN_PROVIDER_OPTIONS: Array<{
  value: BrainProvider;
  label: string;
}> = [
  { value: "openai", label: "OpenAI GPT-4.1" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "google", label: "Google Gemini" },
  { value: "nullxes", label: "NULLXES Brain" },
];

export function getBrainProviderLabel(provider: BrainProvider): string {
  return (
    BRAIN_PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ??
    provider
  );
}
