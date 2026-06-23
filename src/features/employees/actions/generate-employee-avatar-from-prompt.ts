"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { generatePortraitImageFromPrompt } from "../services/generate-portrait-image-from-prompt";

export type GenerateEmployeeAvatarFromPromptSuccess = {
  status: "ready";
  base64: string;
  mimeType: string;
  fileName: string;
};

export type GenerateEmployeeAvatarFromPromptFailure = {
  status: "failed";
  message: string;
};

export type GenerateEmployeeAvatarFromPromptResult =
  | GenerateEmployeeAvatarFromPromptSuccess
  | GenerateEmployeeAvatarFromPromptFailure;

export async function generateEmployeeAvatarFromPrompt(input: {
  prompt: string;
  displayName: string;
  role?: string;
}): Promise<GenerateEmployeeAvatarFromPromptResult> {
  try {
    await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  } catch (error: unknown) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Access denied",
    };
  }

  const prompt = input.prompt.trim();
  const displayName = input.displayName.trim();

  if (!prompt) {
    return { status: "failed", message: "Avatar prompt is required" };
  }

  if (!displayName) {
    return { status: "failed", message: "Display name is required" };
  }

  try {
    const image = await generatePortraitImageFromPrompt({
      prompt,
      name: displayName,
      role: input.role?.trim(),
    });

    return {
      status: "ready",
      base64: image.base64,
      mimeType: image.mimeType,
      fileName: image.fileName,
    };
  } catch (error: unknown) {
    return {
      status: "failed",
      message:
        error instanceof Error ? error.message : "Avatar generation failed",
    };
  }
}
