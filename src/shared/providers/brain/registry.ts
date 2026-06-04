import type { BrainProvider } from "./interfaces";
import type { BrainProviderId, BrainProviderMetadata } from "./types";

type RegisteredBrainProvider = {
  metadata: BrainProviderMetadata;
  provider: BrainProvider;
};

const brainProviders = new Map<BrainProviderId, RegisteredBrainProvider>();

export function registerBrainProvider(
  metadata: BrainProviderMetadata,
  provider: BrainProvider,
): void {
  brainProviders.set(metadata.id, { metadata, provider });
}

export function resolveBrainProvider(id: BrainProviderId): BrainProvider {
  const entry = brainProviders.get(id);
  if (!entry) {
    throw new Error(`Brain provider not registered: ${id}`);
  }
  return entry.provider;
}

export function getBrainProviderMetadata(
  id: BrainProviderId,
): BrainProviderMetadata {
  const entry = brainProviders.get(id);
  if (!entry) {
    throw new Error(`Brain provider not registered: ${id}`);
  }
  return entry.metadata;
}

export function listBrainProviders(): BrainProviderMetadata[] {
  return Array.from(brainProviders.values()).map((entry) => entry.metadata);
}
