import type { BrainProvider } from "@/entities/digital-employee";
import {
  hasAnthropicCredentials,
  hasGoogleCredentials,
  hasOpenAiCredentials,
} from "@/shared/config/provider-env";
import { hasNullxesApiCredentials } from "@/shared/nullxes-sdk";
import type {
  BrainProviderReadiness,
  BrainProviderReadinessMap,
} from "../types/brain-provider-readiness";
import { BRAIN_PROVIDERS } from "./brain-model-catalog";

export type { BrainProviderReadiness, BrainProviderReadinessMap };

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
      return hasNullxesApiCredentials() ? "managed" : "configure";
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
