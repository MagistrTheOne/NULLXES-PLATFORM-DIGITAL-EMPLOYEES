"use server";

import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { requireAuth } from "@/features/auth/services/require-auth";
import { hasWorkspaceAccess } from "@/features/workspace";
import {
  listOrganizationEmployees,
  type EmployeeListPage,
} from "../services/list-organization-employees";

export async function loadMoreEmployeesAction(
  cursor: string,
): Promise<EmployeeListPage | { ok: false; message: string }> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!hasWorkspaceAccess(workspace.permissions, "canViewEmployees")) {
    return { ok: false, message: "Access denied" };
  }

  return listOrganizationEmployees(workspace.organization.id, { cursor });
}
