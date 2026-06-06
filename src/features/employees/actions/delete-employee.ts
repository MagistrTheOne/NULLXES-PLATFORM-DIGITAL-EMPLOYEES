"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { deleteEmployee } from "../services/delete-employee";

export type DeleteEmployeeActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteEmployeeAction(
  employeeId: string,
): Promise<DeleteEmployeeActionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    const result = await deleteEmployee(workspace.organization.id, employeeId);

    if (result.ok) {
      recordAuditEvent({
        organizationId: workspace.organization.id,
        actorUserId: workspace.user.id,
        actorRole: workspace.membership.role,
        action: "employee.deleted",
        resourceType: "digital_employee",
        resourceId: employeeId,
      });
      revalidatePath("/dashboard/employees");
    }

    return result;
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
