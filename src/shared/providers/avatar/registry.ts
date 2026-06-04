import type { AvatarProvider } from "./interfaces";
import type { AvatarProviderId, AvatarProviderMetadata } from "./types";

type RegisteredAvatarProvider = {
  metadata: AvatarProviderMetadata;
  provider: AvatarProvider;
};

const avatarProviders = new Map<AvatarProviderId, RegisteredAvatarProvider>();

export function registerAvatarProvider(
  metadata: AvatarProviderMetadata,
  provider: AvatarProvider,
): void {
  avatarProviders.set(metadata.id, { metadata, provider });
}

export function resolveAvatarProvider(id: AvatarProviderId): AvatarProvider {
  const entry = avatarProviders.get(id);
  if (!entry) {
    throw new Error(`Avatar provider not registered: ${id}`);
  }
  return entry.provider;
}

export function getAvatarProviderMetadata(
  id: AvatarProviderId,
): AvatarProviderMetadata {
  const entry = avatarProviders.get(id);
  if (!entry) {
    throw new Error(`Avatar provider not registered: ${id}`);
  }
  return entry.metadata;
}

export function listAvatarProviders(): AvatarProviderMetadata[] {
  return Array.from(avatarProviders.values()).map((entry) => entry.metadata);
}
