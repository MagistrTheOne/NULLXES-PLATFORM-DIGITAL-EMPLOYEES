"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { assertCanCreateCustomAvatar } from "@/features/billing/services/check-plan-limits";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
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
  let workspace;
  try {
    workspace = await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  } catch (error: unknown) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Access denied",
    };
  }

  const billingPlan = resolveBillingPlanId(workspace.organization.billingPlan);
  const customAvatarCheck = assertCanCreateCustomAvatar(billingPlan);
  if (!customAvatarCheck.ok) {
    return { status: "failed", message: customAvatarCheck.message };
  }

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
