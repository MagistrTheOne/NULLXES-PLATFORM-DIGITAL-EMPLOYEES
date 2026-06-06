"use client";

import { createContext, useContext } from "react";
import type { WorkspacePermissions } from "../types";

const WorkspacePermissionsContext = createContext<WorkspacePermissions | null>(
  null,
);

export function WorkspacePermissionsProvider({
  permissions,
  children,
}: {
  permissions: WorkspacePermissions;
  children: React.ReactNode;
}) {
  return (
    <WorkspacePermissionsContext.Provider value={permissions}>
      {children}
    </WorkspacePermissionsContext.Provider>
  );
}

export function useWorkspacePermissions(): WorkspacePermissions {
  const permissions = useContext(WorkspacePermissionsContext);

  if (!permissions) {
    return {
      role: "viewer",
      canManageOrganization: false,
      canManageMembers: false,
      canManageEmployees: false,
      canOperateEmployees: false,
      canViewEmployees: true,
    };
  }

  return permissions;
}
