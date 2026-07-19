import type { BrainProvider } from "@/entities/digital-employee";
import type {
  BrainProviderReadiness,
  BrainProviderReadinessMap,
} from "../types/brain-provider-readiness";

export type { BrainProviderReadiness, BrainProviderReadinessMap };

/** Card can be selected in UI. Save still requires ready/managed credentials. */
export function isBrainProviderSelectable(
  _provider: BrainProvider,
  _readiness: BrainProviderReadiness,
): boolean {
  return true;
}

export function isBrainProviderConfigured(
  readiness: BrainProviderReadiness,
): boolean {
  return readiness === "ready" || readiness === "managed";
}
