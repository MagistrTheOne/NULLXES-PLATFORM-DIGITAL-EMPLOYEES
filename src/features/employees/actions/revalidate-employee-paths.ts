"use server";

import { revalidatePath } from "next/cache";

export async function revalidateEmployeePaths(employeeId: string): Promise<void> {
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);
}
