import type { AvatarProvider } from "@/shared/providers/avatar/interfaces";
import type {
  CreateAvatarInput,
  CreateAvatarResult,
  DeleteAvatarInput,
  DeleteAvatarResult,
  HealthCheckResult,
  UpdateAvatarInput,
  UpdateAvatarResult,
} from "@/shared/providers/avatar/types";
import {
  getAnamApiBaseUrl,
  getAnamApiKey,
  hasAnamCredentials,
} from "@/shared/config/provider-env";
import type { AnamAvatarAdapterConfig } from "./config";
import { ANAM_AVATAR_PROVIDER_ID } from "./config";

type AnamAvatarResponse = {
  id?: string;
};

export function createAnamAvatarAdapter(
  config: AnamAvatarAdapterConfig,
): AvatarProvider {
  return {
    async createAvatar(input: CreateAvatarInput): Promise<CreateAvatarResult> {
      if (config.avatarId && !config.imageUrl) {
        return {
          avatarId: config.avatarId,
          providerId: ANAM_AVATAR_PROVIDER_ID,
        };
      }

      const apiKey = getAnamApiKey();
      if (!apiKey) {
        throw new Error("ANAM_API_KEY is not configured");
      }

      const imageUrl = config.imageUrl;
      if (!imageUrl) {
        throw new Error("Anam avatar creation requires imageUrl in provider config");
      }

      const response = await fetch(`${getAnamApiBaseUrl()}/avatars`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: config.displayName ?? input.name,
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Anam createAvatar failed with status ${response.status}`,
        );
      }

      const payload = (await response.json()) as AnamAvatarResponse;
      if (!payload.id) {
        throw new Error("Anam createAvatar returned an invalid response");
      }

      return {
        avatarId: payload.id,
        providerId: ANAM_AVATAR_PROVIDER_ID,
      };
    },

    async updateAvatar(input: UpdateAvatarInput): Promise<UpdateAvatarResult> {
      const apiKey = getAnamApiKey();
      if (!apiKey) {
        throw new Error("ANAM_API_KEY is not configured");
      }

      const avatarId = input.avatarId || config.avatarId;
      const response = await fetch(`${getAnamApiBaseUrl()}/avatars/${avatarId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: input.name ?? config.displayName ?? "NULLXES Digital Employee",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Anam updateAvatar failed with status ${response.status}`,
        );
      }

      return {
        avatarId,
        updated: true,
      };
    },

    async deleteAvatar(input: DeleteAvatarInput): Promise<DeleteAvatarResult> {
      const apiKey = getAnamApiKey();
      if (!apiKey) {
        throw new Error("ANAM_API_KEY is not configured");
      }

      const response = await fetch(
        `${getAnamApiBaseUrl()}/avatars/${input.avatarId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(
          `Anam deleteAvatar failed with status ${response.status}`,
        );
      }

      return {
        avatarId: input.avatarId,
        deleted: true,
      };
    },

    async healthCheck(): Promise<HealthCheckResult> {
      if (!hasAnamCredentials()) {
        return {
          healthy: Boolean(config.avatarId),
          providerId: ANAM_AVATAR_PROVIDER_ID,
        };
      }

      try {
        const apiKey = getAnamApiKey();
        const response = await fetch(`${getAnamApiBaseUrl()}/avatars?perPage=1`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        return {
          healthy: response.ok,
          providerId: ANAM_AVATAR_PROVIDER_ID,
        };
      } catch {
        return {
          healthy: false,
          providerId: ANAM_AVATAR_PROVIDER_ID,
        };
      }
    },
  };
}
