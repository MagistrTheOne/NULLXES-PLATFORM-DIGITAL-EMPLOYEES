"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import {
  anamFetchWithKeyPool,
  hasAnamCredentials,
} from "@/shared/config/provider-env";
import {
  STUDIO_AVATAR_PRESET_CATALOG,
  type StudioAvatarPreset,
} from "./avatar-preset-catalog";

type AnamAvatarListItem = {
  id?: string;
  displayName?: string;
  imageUrl?: string;
};

type AnamListResponse = {
  data?: AnamAvatarListItem[];
};

export type ListStudioAvatarPresetsResult =
  | { ok: true; presets: StudioAvatarPreset[] }
  | { ok: false; message: string };

function mergeCatalogWithAnamAvatars(
  anamAvatars: AnamAvatarListItem[],
): StudioAvatarPreset[] {
  return STUDIO_AVATAR_PRESET_CATALOG.map((preset, index) => {
    const anamAvatar = anamAvatars[index];
    if (!anamAvatar?.id || !anamAvatar.imageUrl) {
      return preset;
    }

    return {
      ...preset,
      id: anamAvatar.id,
      imageUrl: anamAvatar.imageUrl,
    };
  }).filter((preset) => preset.imageUrl.length > 0);
}

export async function listStudioAvatarPresets(): Promise<ListStudioAvatarPresetsResult> {
  try {
    await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }

  if (!hasAnamCredentials()) {
    return { ok: false, message: "Avatar presets are temporarily unavailable" };
  }

  try {
    const perPage = STUDIO_AVATAR_PRESET_CATALOG.length;
    const { response } = await anamFetchWithKeyPool(
      `/avatars?perPage=${perPage}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return {
        ok: false,
        message: "Could not load avatar presets. Try again shortly.",
      };
    }

    const payload = (await response.json()) as AnamListResponse;
    const presets = mergeCatalogWithAnamAvatars(payload.data ?? []);

    if (presets.length === 0) {
      return {
        ok: false,
        message: "No avatar presets are available right now.",
      };
    }

    return { ok: true, presets };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to load avatar presets",
    };
  }
}

export async function resolveStudioAvatarPreset(
  presetAvatarId: string,
): Promise<{ avatarId: string; previewUrl: string; anamApiKeySlot: AnamApiKeySlot }> {
  const { response, slot } = await anamFetchWithKeyPool(
    `/avatars/${encodeURIComponent(presetAvatarId)}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error("Selected avatar preset is no longer available");
  }

  const avatar = (await response.json()) as AnamAvatarListItem;
  if (!avatar.id || !avatar.imageUrl) {
    throw new Error("Selected avatar preset returned an invalid response");
  }

  return {
    avatarId: avatar.id,
    previewUrl: avatar.imageUrl,
    anamApiKeySlot: slot,
  };
}
