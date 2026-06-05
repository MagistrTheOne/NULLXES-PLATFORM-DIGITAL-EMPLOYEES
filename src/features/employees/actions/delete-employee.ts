"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { deleteEmployee } from "../services/delete-employee";

export type DeleteEmployeeActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteEmployeeAction(
  employeeId: string,
): Promise<DeleteEmployeeActionResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  const result = await deleteEmployee(workspace.organization.id, employeeId);

  if (result.ok) {
    revalidatePath("/dashboard/employees");
  }

  return result;
}
