import type { SessionProvider } from "./interfaces";
import type { SessionProviderId, SessionProviderMetadata } from "./types";

type RegisteredSessionProvider = {
  metadata: SessionProviderMetadata;
  provider: SessionProvider;
};

const sessionProviders = new Map<SessionProviderId, RegisteredSessionProvider>();

export function registerSessionProvider(
  metadata: SessionProviderMetadata,
  provider: SessionProvider,
): void {
  sessionProviders.set(metadata.id, { metadata, provider });
}

export function resolveSessionProvider(id: SessionProviderId): SessionProvider {
  const entry = sessionProviders.get(id);
  if (!entry) {
    throw new Error(`Session provider not registered: ${id}`);
  }
  return entry.provider;
}

export function getSessionProviderMetadata(
  id: SessionProviderId,
): SessionProviderMetadata {
  const entry = sessionProviders.get(id);
  if (!entry) {
    throw new Error(`Session provider not registered: ${id}`);
  }
  return entry.metadata;
}

export function listSessionProviders(): SessionProviderMetadata[] {
  return Array.from(sessionProviders.values()).map((entry) => entry.metadata);
}
