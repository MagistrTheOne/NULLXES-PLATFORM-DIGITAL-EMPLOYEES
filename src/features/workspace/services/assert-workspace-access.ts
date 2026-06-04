import type { WorkspaceAccessCheck, WorkspacePermissions } from "../types";

export function assertWorkspaceAccess(
  permissions: WorkspacePermissions,
  check: WorkspaceAccessCheck,
): void {
  if (!permissions[check]) {
    throw new Error(`Workspace access denied: ${check}`);
  }
}

export function hasWorkspaceAccess(
  permissions: WorkspacePermissions,
  check: WorkspaceAccessCheck,
): boolean {
  return permissions[check];
}
