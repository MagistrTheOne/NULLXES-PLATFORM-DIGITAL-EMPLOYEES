import {
  getAnamApiBaseUrl,
  getAnamApiKey,
} from "@/shared/config/provider-env";
import { ANAM_AVATAR_PROVIDER_ID } from "@/providers/avatar/anam/config";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

type AnamAvatarResponse = {
  id?: string;
  imageUrl?: string;
};

export type CreateAnamAvatarFromFileResult = {
  avatarId: string;
  previewUrl: string;
  provider: typeof ANAM_AVATAR_PROVIDER_ID;
};

export async function createAnamAvatarFromFile(input: {
  file: File;
  displayName: string;
}): Promise<CreateAnamAvatarFromFileResult> {
  const apiKey = getAnamApiKey();
  if (!apiKey) {
    throw new Error("ANAM_API_KEY is not configured");
  }

  if (input.file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }

  if (!input.file.type.startsWith("image/")) {
    throw new Error("Upload a PNG, JPG, or WebP image");
  }

  const formData = new FormData();
  formData.append("displayName", input.displayName);
  formData.append("image", input.file, input.file.name);

  const createResponse = await fetch(`${getAnamApiBaseUrl()}/avatars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!createResponse.ok) {
    throw new Error(
      `Anam avatar creation failed with status ${createResponse.status}`,
    );
  }

  const created = (await createResponse.json()) as AnamAvatarResponse;
  if (!created.id) {
    throw new Error("Anam avatar creation returned an invalid response");
  }

  let previewUrl = created.imageUrl ?? "";

  if (!previewUrl) {
    const getResponse = await fetch(
      `${getAnamApiBaseUrl()}/avatars/${created.id}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
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
  };
}
