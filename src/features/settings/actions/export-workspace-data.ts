"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { getSettingsPageData } from "../services/get-settings-page-data";

export async function exportWorkspaceDataAction(): Promise<
  { ok: true; payload: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to export workspace data." };
  }

  const data = await getSettingsPageData(workspace);

  return {
    ok: true,
    payload: JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        organization: data.organization,
        settings: data.settings,
        context: data.context,
      },
      null,
      2,
    ),
  };
}
