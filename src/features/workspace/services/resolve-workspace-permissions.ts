import type { MembershipRole, WorkspacePermissions } from "../types";

export function resolveWorkspacePermissions(
  role: MembershipRole,
): WorkspacePermissions {
  switch (role) {
    case "owner":
      return {
        role,
        canManageOrganization: true,
        canManageMembers: true,
        canManageEmployees: true,
        canOperateEmployees: true,
        canViewEmployees: true,
      };
    case "admin":
      return {
        role,
        canManageOrganization: false,
        canManageMembers: true,
        canManageEmployees: true,
        canOperateEmployees: true,
        canViewEmployees: true,
      };
    case "operator":
      return {
        role,
        canManageOrganization: false,
        canManageMembers: false,
        canManageEmployees: false,
        canOperateEmployees: true,
        canViewEmployees: true,
      };
    case "viewer":
      return {
        role,
        canManageOrganization: false,
        canManageMembers: false,
        canManageEmployees: false,
        canOperateEmployees: false,
        canViewEmployees: true,
      };
    default: {
      const exhaustive: never = role;
      throw new Error(`Unsupported membership role: ${exhaustive}`);
    }
  }
}
