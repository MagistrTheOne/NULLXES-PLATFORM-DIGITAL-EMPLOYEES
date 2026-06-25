import type { BrainProvider } from "@/entities/digital-employee";
import {
  hasAnthropicCredentials,
  hasGoogleCredentials,
  hasNullxesBrainCredentials,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";
import { BRAIN_PROVIDERS } from "./brain-model-catalog";

export type BrainProviderReadiness = "ready" | "configure" | "managed";

export type BrainProviderReadinessMap = Record<
  BrainProvider,
  BrainProviderReadiness
>;

function resolveProviderReadiness(
  provider: BrainProvider,
): BrainProviderReadiness {
  switch (provider) {
    case "openai":
      return hasOpenAiCredentials() ? "ready" : "configure";
    case "anthropic":
      return hasAnthropicCredentials() ? "ready" : "configure";
    case "google":
      return hasGoogleCredentials() ? "ready" : "configure";
    case "nullxes":
      return hasNullxesBrainCredentials() ? "managed" : "configure";
  }
}

export function getBrainProviderReadinessMap(): BrainProviderReadinessMap {
  return BRAIN_PROVIDERS.reduce<BrainProviderReadinessMap>((map, provider) => {
    map[provider] = resolveProviderReadiness(provider);
    return map;
  }, {} as BrainProviderReadinessMap);
}

export function isBrainProviderSelectable(
  provider: BrainProvider,
  readiness: BrainProviderReadiness,
): boolean {
  return readiness === "ready" || readiness === "managed";
}
