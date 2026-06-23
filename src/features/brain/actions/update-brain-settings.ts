"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  parseBrainProvider,
  updateOrganizationSettings,
} from "@/features/settings/services/update-organization-settings";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import {
  getBrainProviderReadinessMap,
  isBrainProviderSelectable,
} from "../lib/brain-provider-readiness";

export type UpdateBrainSettingsInput = {
  defaultBrainProvider: string;
  defaultBrainModel: string;
};

export type UpdateBrainSettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateBrainSettingsAction(
  input: UpdateBrainSettingsInput,
): Promise<UpdateBrainSettingsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "You do not have permission to update brain settings.",
    };
  }

  const defaultBrainProvider = parseBrainProvider(input.defaultBrainProvider);

  if (!defaultBrainProvider) {
    return { ok: false, message: "Select a valid LLM provider." };
  }

  const readiness = getBrainProviderReadinessMap()[defaultBrainProvider];

  if (!isBrainProviderSelectable(defaultBrainProvider, readiness)) {
    return {
      ok: false,
      message: "Selected provider is not configured for this workspace.",
    };
  }

  const defaultBrainModel = resolveBrainModelForProvider(
    defaultBrainProvider,
    input.defaultBrainModel,
  );

  const result = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: {
      defaultBrainProvider,
      defaultBrainModel,
    },
  });

  if (result.ok) {
    revalidatePath("/settings");
  }

  return result;
}
