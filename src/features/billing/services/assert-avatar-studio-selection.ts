import type { BillingPlanId } from "@/features/billing/config/plans";
import { planAllowsCustomAvatars } from "@/features/billing/lib/plan-capabilities";
import { isWorkforceAvatarPresetId } from "@/features/employees/studio/avatar/avatar-preset-catalog";

export type AvatarStudioSelection = {
  presetAvatarId: string;
  hasPhotoFile: boolean;
};

export type AvatarStudioSelectionResult =
  | { ok: true; mode: "preset" | "custom" }
  | { ok: false; message: string };

export function assertAvatarStudioSelection(
  billingPlan: BillingPlanId,
  selection: AvatarStudioSelection,
): AvatarStudioSelectionResult {
  const presetAvatarId = selection.presetAvatarId.trim();
  const hasPreset = presetAvatarId.length > 0;
  const hasFile = selection.hasPhotoFile;

  if (hasPreset && !isWorkforceAvatarPresetId(presetAvatarId)) {
    return {
      ok: false,
      message: "Selected avatar preset is invalid",
    };
  }

  if (hasPreset && hasFile) {
    return {
      ok: false,
      message: "Send either a workforce preset or a custom photo, not both",
    };
  }

  if (!planAllowsCustomAvatars(billingPlan)) {
    if (hasFile) {
      return {
        ok: false,
        message:
          "Custom avatars start on Studio. Choose a NULLXES preset on Evaluation, or upgrade your plan.",
      };
    }

    if (!hasPreset) {
      return {
        ok: false,
        message: "Choose a NULLXES workforce preset avatar on your plan",
      };
    }

    return { ok: true, mode: "preset" };
  }

  if (hasPreset) {
    return { ok: true, mode: "preset" };
  }

  if (hasFile) {
    return { ok: true, mode: "custom" };
  }

  return {
    ok: false,
    message: "Upload a photo or choose a workforce preset",
  };
}
