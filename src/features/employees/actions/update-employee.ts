"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { updateEmployee } from "../services/update-employee";
import { revalidateEmployeePaths } from "./revalidate-employee-paths";

export type UpdateEmployeeActionInput = {
  employeeId: string;
  name: string;
  role: string;
  description: string;
  status: EmployeeStatus;
  systemPrompt: string;
};

export type UpdateEmployeeActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateEmployeeAction(
  input: UpdateEmployeeActionInput,
): Promise<UpdateEmployeeActionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    const result = await updateEmployee({
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      actorUserId: workspace.user.id,
      name: input.name,
      role: input.role,
      description: input.description.trim() || null,
      status: input.status,
      systemPrompt: input.systemPrompt,
    });

    if (result.ok) {
      await revalidateEmployeePaths(input.employeeId);
    }

    return result;
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
