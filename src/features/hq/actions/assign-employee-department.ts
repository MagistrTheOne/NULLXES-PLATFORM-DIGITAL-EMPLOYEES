"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { isHqDepartment } from "../lib/map-employee-department";
import { updateEmployeeDepartment } from "../services/update-employee-department";

export type AssignDepartmentResult =
  | { ok: true }
  | { ok: false; message: string };

export async function assignEmployeeDepartmentAction(
  employeeId: string,
  department: string,
): Promise<AssignDepartmentResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    if (!isHqDepartment(department)) {
      return { ok: false, message: "Invalid department" };
    }

    const updated = await updateEmployeeDepartment({
      organizationId: workspace.organization.id,
      employeeId,
      department,
    });

    if (!updated) {
      return { ok: false, message: "Employee not found" };
    }

    revalidatePath("/dashboard/hq");
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
