"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";
import { getHqState } from "../services/get-hq-state";
import type { HqState } from "../types";

/**
 * Fetch a fresh headquarters snapshot for the current workspace. Used by the
 * client realtime hook to keep the floor in sync with real DB state.
 * Returns null on any failure (including transient DB issues).
 */
export async function refreshHqStateAction(): Promise<HqState | null> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canViewEmployees",
    );
    return await getHqState(workspace.organization.id);
  } catch (error: unknown) {
    if (
      isTransientDatabaseError(error) ||
      (error instanceof Error &&
        error.message.includes("database temporarily unreachable"))
    ) {
      return null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("[HQ] refreshHqStateAction failed", error);
    }
    return null;
  }
}
