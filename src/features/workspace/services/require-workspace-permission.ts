import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import type { WorkspaceAccessCheck, WorkspaceContext } from "../types";
import { assertWorkspaceAccess } from "./assert-workspace-access";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

export class WorkspaceAccessDeniedError extends Error {
  constructor(check: WorkspaceAccessCheck) {
    super(`Workspace access denied: ${check}`);
    this.name = "WorkspaceAccessDeniedError";
  }
}

export async function requireWorkspacePermission(
  check: WorkspaceAccessCheck,
): Promise<WorkspaceContext> {
  const session = await requireAuth();
  let workspace: WorkspaceContext;
  try {
    workspace = await ensureWorkspace(session.user.id, session.user.name);
  } catch (error: unknown) {
    if (isTransientDatabaseError(error)) {
      throw new Error("Failed to get session: database temporarily unreachable");
    }
    throw error;
  }

  try {
    assertWorkspaceAccess(workspace.permissions, check);
  } catch {
    throw new WorkspaceAccessDeniedError(check);
  }

  return workspace;
}

export function workspaceAccessDeniedMessage(check: WorkspaceAccessCheck): string {
  switch (check) {
    case "canManageOrganization":
      return "You do not have permission to manage organization settings.";
    case "canManageMembers":
      return "You do not have permission to manage team members.";
    case "canManageEmployees":
      return "You do not have permission to manage digital employees.";
    case "canOperateEmployees":
      return "You do not have permission to operate digital employees.";
    case "canViewEmployees":
      return "You do not have permission to view digital employees.";
    default:
      return "You do not have permission to perform this action.";
  }
}

export async function requireWorkspacePermissionOrThrowMessage(
  check: WorkspaceAccessCheck,
): Promise<WorkspaceContext> {
  try {
    return await requireWorkspacePermission(check);
  } catch (error: unknown) {
    if (error instanceof WorkspaceAccessDeniedError) {
      throw new Error(workspaceAccessDeniedMessage(check));
    }
    if (isTransientDatabaseError(error)) {
      throw new Error("Database is temporarily unreachable. Please try again.");
    }
    throw error;
  }
}
