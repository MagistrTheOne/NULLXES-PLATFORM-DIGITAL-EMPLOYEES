"use server";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import {
  ensureOrganizationSettings,
  OrganizationSettingsTableMissingError,
} from "@/entities/organization-settings/ensure-organization-settings";
import { resolveWorkspace } from "@/features/workspace";
import type { WorkspaceContext } from "@/features/workspace";
import { db } from "@/shared/db/client";
import { provisionDefaultWorkspace } from "./provision-default-workspace";

async function loadWorkspace(
  userId: string,
  displayName: string,
): Promise<WorkspaceContext> {
  const existingMembership = await db
    .select({ id: membership.id })
    .from(membership)
    .where(eq(membership.userId, userId))
    .limit(1);

  if (existingMembership.length === 0) {
    await provisionDefaultWorkspace(userId, displayName);
  }

  const workspace = await resolveWorkspace({ userId });

  try {
    await ensureOrganizationSettings(workspace.organization.id);
  } catch (error: unknown) {
    if (!(error instanceof OrganizationSettingsTableMissingError)) {
      throw error;
    }
  }

  return workspace;
}

export const ensureWorkspace = cache(loadWorkspace);
