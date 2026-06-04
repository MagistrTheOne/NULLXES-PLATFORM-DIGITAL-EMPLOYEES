import type { AvatarProviderConfigPayload } from "@/entities/provider-config";

export type AnamAvatarAdapterConfig = AvatarProviderConfigPayload & {
  imageUrl?: string;
  displayName?: string;
};

export const ANAM_AVATAR_PROVIDER_ID = "anam" as const;
