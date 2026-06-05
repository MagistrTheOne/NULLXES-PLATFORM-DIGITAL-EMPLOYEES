"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { updateOrganizationProfile } from "../services/update-organization-profile";

export type UpdateOrganizationProfileInput = {
  name: string;
  website: string;
  industry: string;
  timezone: string;
};

export type UpdateOrganizationProfileResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateOrganizationProfileAction(
  input: UpdateOrganizationProfileInput,
): Promise<UpdateOrganizationProfileResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to update organization settings." };
  }

  const profileResult = await updateOrganizationProfile({
    organizationId: workspace.organization.id,
    name: input.name,
  });

  if (!profileResult.ok) {
    return profileResult;
  }

  const { updateOrganizationSettings } = await import(
    "../services/update-organization-settings"
  );

  const settingsResult = await updateOrganizationSettings({
    organizationId: workspace.organization.id,
    settings: {
      website: input.website.trim() || null,
      industry: input.industry,
      timezone: input.timezone,
    },
  });

  if (!settingsResult.ok) {
    return settingsResult;
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { ok: true };
}
