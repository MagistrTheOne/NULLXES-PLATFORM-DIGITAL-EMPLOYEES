import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import {
  anamFetchWithSlot,
  isAnamAvatarQuotaError,
  readAnamErrorMessage,
} from "@/shared/config/provider-env";
import { listAnamSlotsWithPersonaCapacity } from "@/features/provider-provisioning/services/resolve-anam-persona-slot";
import { ANAM_AVATAR_PROVIDER_ID } from "@/providers/avatar/anam/config";

const MAX_AVATAR_BYTES = Math.floor(4.5 * 1024 * 1024);
const MIN_DISPLAY_NAME_LENGTH = 3;
const MAX_DISPLAY_NAME_LENGTH = 50;

type AnamAvatarResponse = {
  id?: string;
  imageUrl?: string;
};

function normalizeDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  if (trimmed.length >= MIN_DISPLAY_NAME_LENGTH) {
    return trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
  }

  return "NULLXES Digital Employee";
}

function buildAvatarFormData(file: File, displayName: string): FormData {
  const formData = new FormData();
  formData.append("displayName", normalizeDisplayName(displayName));
  formData.append("imageFile", file, file.name);
  return formData;
}

export type CreateAnamAvatarFromFileResult = {
  avatarId: string;
  previewUrl: string;
  provider: typeof ANAM_AVATAR_PROVIDER_ID;
  anamApiKeySlot: AnamApiKeySlot;
};

export async function createAnamAvatarFromFile(input: {
  file: File;
  displayName: string;
  excludeEmployeeId?: string;
}): Promise<CreateAnamAvatarFromFileResult> {
  if (input.file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image must be 4.5MB or smaller");
  }

  if (!input.file.type.startsWith("image/")) {
    throw new Error("Upload a PNG, JPG, or WebP image");
  }

  const candidateSlots = await listAnamSlotsWithPersonaCapacity({
    excludeEmployeeId: input.excludeEmployeeId,
  });

  if (candidateSlots.length === 0) {
    throw new Error(
      "All configured Anam lab keys already have a persona. Add another ANAM_API_KEY or remove an employee from a full lab.",
    );
  }

  let lastError = "Failed to create Anam avatar";

  for (const slot of candidateSlots) {
    const createResponse = await anamFetchWithSlot(
      "/avatars",
      {
        method: "POST",
        body: buildAvatarFormData(input.file, input.displayName),
      },
      slot,
    );

    if (createResponse.ok) {
      const created = (await createResponse.json()) as AnamAvatarResponse;
      if (!created.id) {
        throw new Error("Anam avatar creation returned an invalid response");
      }

      let previewUrl = created.imageUrl ?? "";

      if (!previewUrl) {
        const getResponse = await anamFetchWithSlot(
          `/avatars/${created.id}`,
          { method: "GET" },
          slot,
        );

        if (getResponse.ok) {
          const details = (await getResponse.json()) as AnamAvatarResponse;
          previewUrl = details.imageUrl ?? "";
        }
      }

      if (!previewUrl) {
        throw new Error("Anam avatar was created but preview URL is unavailable");
      }

      return {
        avatarId: created.id,
        previewUrl,
        provider: ANAM_AVATAR_PROVIDER_ID,
        anamApiKeySlot: slot,
      };
    }

    const detail = await readAnamErrorMessage(createResponse);
    lastError = detail;

    if (isAnamAvatarQuotaError(createResponse.status, detail)) {
      continue;
    }

    throw new Error(
      `Anam avatar upload failed on ${slot}: ${detail}`,
    );
  }

  throw new Error(
    `All Anam lab keys with persona capacity are at the one-shot avatar limit. ${lastError}`,
  );
}
