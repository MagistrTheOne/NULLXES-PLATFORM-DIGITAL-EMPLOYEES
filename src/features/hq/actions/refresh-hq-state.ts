"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { getHqState } from "../services/get-hq-state";
import type { HqState } from "../types";

/**
 * Fetch a fresh headquarters snapshot for the current workspace. Used by the
 * client realtime hook to keep the floor in sync with real DB state.
 */
export async function refreshHqStateAction(): Promise<HqState | null> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canViewEmployees",
    );
    return await getHqState(workspace.organization.id);
  } catch {
    return null;
  }
}
