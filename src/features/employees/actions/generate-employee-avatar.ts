"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { createAnamAvatarFromFile } from "@/features/employees/studio/anam-create-avatar-from-file";

export type GenerateEmployeeAvatarSuccess = {
  status: "ready";
  avatarId: string;
  previewUrl: string;
  provider: "anam";
};

export type GenerateEmployeeAvatarFailure = {
  status: "failed";
  message: string;
};

export type GenerateEmployeeAvatarResult =
  | GenerateEmployeeAvatarSuccess
  | GenerateEmployeeAvatarFailure;

export async function generateEmployeeAvatar(
  formData: FormData,
): Promise<GenerateEmployeeAvatarResult> {
  await requireAuth();

  const file = formData.get("file");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!(file instanceof File)) {
    return { status: "failed", message: "Photo file is required" };
  }

  if (!displayName) {
    return { status: "failed", message: "Display name is required" };
  }

  try {
    const result = await createAnamAvatarFromFile({ file, displayName });
    return {
      status: "ready",
      avatarId: result.avatarId,
      previewUrl: result.previewUrl,
      provider: result.provider,
    };
  } catch (error) {
    return {
      status: "failed",
      message:
        error instanceof Error ? error.message : "Avatar generation failed",
    };
  }
}
