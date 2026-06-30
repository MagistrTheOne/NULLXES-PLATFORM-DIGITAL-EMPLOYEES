"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";

export async function revalidateEmployeePaths(employeeId: string): Promise<void> {
  await requireWorkspacePermissionOrThrowMessage("canManageEmployees");
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);
}
