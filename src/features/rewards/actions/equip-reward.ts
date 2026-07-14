"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { getEmployeeForOrganization } from "@/features/employees/services/get-employee-for-organization";
import {
  equipRewardOnEmployee,
  upsertEmployeeLoadout,
} from "@/features/rewards/services/employee-loadout";
import type { EmployeeLoadout } from "@/features/rewards/lib/loadout";

export type EquipActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function equipRewardOnEmployeeAction(input: {
  employeeId: string;
  rewardSlug: string;
}): Promise<EquipActionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );
    const employee = await getEmployeeForOrganization(
      workspace.organization.id,
      input.employeeId,
    );
    if (!employee) {
      return { ok: false, message: "Employee not found" };
    }

    const result = await equipRewardOnEmployee({
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      rewardSlug: input.rewardSlug,
    });
    if (!result.ok) return result;

    revalidatePath("/dashboard/inventory");
    revalidatePath(`/dashboard/employees/${input.employeeId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to equip reward",
    };
  }
}

export async function saveEmployeeLoadoutAction(input: {
  employeeId: string;
  loadout: EmployeeLoadout;
}): Promise<EquipActionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );
    const employee = await getEmployeeForOrganization(
      workspace.organization.id,
      input.employeeId,
    );
    if (!employee) {
      return { ok: false, message: "Employee not found" };
    }

    const result = await upsertEmployeeLoadout({
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      loadout: input.loadout,
    });
    if (!result.ok) return result;

    revalidatePath("/dashboard/inventory");
    revalidatePath(`/dashboard/employees/${input.employeeId}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to save loadout",
    };
  }
}
