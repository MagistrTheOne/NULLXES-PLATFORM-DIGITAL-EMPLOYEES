"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import type { BrainProvider } from "@/entities/digital-employee";
import {
  getBrainProviderReadinessMap,
  type BrainProviderReadinessMap,
} from "../lib/brain-provider-readiness";
import { getOrganizationBrainDefaults } from "../services/get-organization-brain-defaults";

export type BrainWorkspaceConfig = {
  defaultBrainProvider: BrainProvider;
  defaultBrainModel: string;
  providerReadiness: BrainProviderReadinessMap;
};

export type GetBrainWorkspaceConfigResult =
  | { ok: true; config: BrainWorkspaceConfig }
  | { ok: false; message: string };

export async function getBrainWorkspaceConfigAction(): Promise<GetBrainWorkspaceConfigResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageEmployees) {
    return {
      ok: false,
      message: "You do not have permission to view brain configuration.",
    };
  }

  const defaults = await getOrganizationBrainDefaults(workspace.organization.id);

  return {
    ok: true,
    config: {
      defaultBrainProvider: defaults.defaultBrainProvider,
      defaultBrainModel: defaults.defaultBrainModel,
      providerReadiness: await getBrainProviderReadinessMap(
        workspace.organization.id,
      ),
    },
  };
}
