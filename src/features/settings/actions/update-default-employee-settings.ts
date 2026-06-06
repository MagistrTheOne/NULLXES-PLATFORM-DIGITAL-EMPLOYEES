"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import {
  parseBrainProvider,
  updateOrganizationSettings,
} from "../services/update-organization-settings";
import { resolveBrainModelForProvider } from "../lib/brain-model-defaults";

export type UpdateDefaultEmployeeSettingsInput = {
  defaultBrainProvider: string;
  defaultBrainModel: string;
  knowledgeProcessing: string;
  sessionRetentionDays: number;
};

export type UpdateDefaultEmployeeSettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateDefaultEmployeeSettingsAction(
  input: UpdateDefaultEmployeeSettingsInput,
): Promise<UpdateDefaultEmployeeSettingsResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return {
      ok: false,
      message: "You do not have permission to update default employee settings.",
    };
  }

  const defaultBrainProvider = parseBrainProvider(input.defaultBrainProvider);

  if (!defaultBrainProvider) {
    return { ok: false, message: "Select a valid LLM provider." };
  }

  if (input.knowledgeProcessing !== "auto" && input.knowledgeProcessing !== "manual") {
    return { ok: false, message: "Select a valid knowledge processing mode." };
  }

  if (input.sessionRetentionDays < 7 || input.sessionRetentionDays > 365) {
    return { ok: false, message: "Session retention must be between 7 and 365 days." };
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
      knowledgeProcessing: input.knowledgeProcessing,
      sessionRetentionDays: input.sessionRetentionDays,
    },
  });

  if (result.ok) {
    revalidatePath("/settings");
  }

  return result;
}
