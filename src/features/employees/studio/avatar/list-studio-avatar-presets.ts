"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import {
  anamFetchWithKeyPool,
  hasAnamCredentials,
} from "@/shared/config/provider-env";
import {
  WORKFORCE_AVATAR_PRESETS,
  getWorkforceAvatarPresetDefinition,
  isWorkforceAvatarPresetId,
  toStudioAvatarPreset,
  type StudioAvatarPreset,
  type StudioAvatarPresetDefinition,
  type WorkforceAvatarPresetId,
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

function readEnvAvatarId(definition: StudioAvatarPresetDefinition): string | null {
  const value = process.env[definition.anamAvatarIdEnv]?.trim();
  return value && value.length > 0 ? value : null;
}

async function fetchAnamAvatarById(
  avatarId: string,
): Promise<AnamAvatarListItem | null> {
  const { response } = await anamFetchWithKeyPool(
    `/avatars/${encodeURIComponent(avatarId)}`,
    { method: "GET" },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AnamAvatarListItem;
}

async function fetchAnamAvatarCatalog(): Promise<AnamAvatarListItem[]> {
  const { response } = await anamFetchWithKeyPool("/avatars?perPage=100", {
    method: "GET",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as AnamListResponse;
  return payload.data ?? [];
}

function matchCatalogAvatar(
  definition: StudioAvatarPresetDefinition,
  catalog: AnamAvatarListItem[],
): AnamAvatarListItem | null {
  const hint = definition.anamDisplayNameHint.toLowerCase();

  return (
    catalog.find((avatar) =>
      avatar.displayName?.trim().toLowerCase().includes(hint),
    ) ?? null
  );
}

async function resolvePresetAnamAvatar(
  definition: StudioAvatarPresetDefinition,
  catalog: AnamAvatarListItem[],
): Promise<AnamAvatarListItem | null> {
  const envAvatarId = readEnvAvatarId(definition);
  if (envAvatarId) {
    const fromEnv = await fetchAnamAvatarById(envAvatarId);
    if (fromEnv?.id) {
      return fromEnv;
    }
  }

  return matchCatalogAvatar(definition, catalog);
}

export async function resolveWorkforceAvatarPreset(
  presetId: WorkforceAvatarPresetId,
): Promise<StudioAvatarPreset & { anamAvatarId: string; anamApiKeySlot: AnamApiKeySlot }> {
  const definition = getWorkforceAvatarPresetDefinition(presetId);
  const catalog = await fetchAnamAvatarCatalog();
  const avatar = await resolvePresetAnamAvatar(definition, catalog);

  if (!avatar?.id) {
    throw new Error(`${definition.name} is not available in the workforce preset catalog`);
  }

  const { slot } = await anamFetchWithKeyPool(
    `/avatars/${encodeURIComponent(avatar.id)}`,
    { method: "GET" },
  );

  return {
    ...toStudioAvatarPreset(definition, avatar.imageUrl ?? null),
    anamAvatarId: avatar.id,
    anamApiKeySlot: slot,
  };
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
    return {
      ok: true,
      presets: WORKFORCE_AVATAR_PRESETS.map((definition) =>
        toStudioAvatarPreset(definition, null),
      ),
    };
  }

  try {
    const catalog = await fetchAnamAvatarCatalog();
    const presets = await Promise.all(
      WORKFORCE_AVATAR_PRESETS.map(async (definition) => {
        const avatar = await resolvePresetAnamAvatar(definition, catalog);
        return toStudioAvatarPreset(definition, avatar?.imageUrl ?? null);
      }),
    );

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
  if (!isWorkforceAvatarPresetId(presetAvatarId)) {
    throw new Error("Selected avatar preset is invalid");
  }

  const resolved = await resolveWorkforceAvatarPreset(presetAvatarId);
  if (!resolved.imageUrl) {
    throw new Error("Selected avatar preset has no preview image");
  }

  return {
    avatarId: resolved.anamAvatarId,
    previewUrl: resolved.imageUrl,
    anamApiKeySlot: resolved.anamApiKeySlot,
  };
}
