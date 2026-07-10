"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { pauseDigitalEmployee } from "@/features/employee/use-cases/pause-digital-employee";
import { getEmployeeForOrganization } from "@/features/employees/services/get-employee-for-organization";
import { assertNotPlatformCatalogEmployee } from "@/features/employees/services/platform-employee-catalog";
import { revalidateEmployeePaths } from "@/features/employees/actions/revalidate-employee-paths";

export type PauseHqEmployeeResult =
  | { ok: true }
  | { ok: false; message: string };

export async function pauseHqEmployeeAction(
  employeeId: string,
): Promise<PauseHqEmployeeResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    const catalogGuard = await assertNotPlatformCatalogEmployee(employeeId);
    if (!catalogGuard.ok) {
      return catalogGuard;
    }

    const employee = await getEmployeeForOrganization(
      workspace.organization.id,
      employeeId,
    );
    if (!employee) {
      return { ok: false, message: "Employee not found" };
    }

    await pauseDigitalEmployee({
      employeeId,
      actorUserId: workspace.user.id,
      reason: "Paused from NULLXES HQ",
    });

    await revalidateEmployeePaths(employeeId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to pause employee",
    };
  }
}
