import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import { getEmployeeForOrganization } from "./get-employee-for-organization";

export async function deleteEmployee(
  organizationId: string,
  employeeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const existing = await getEmployeeForOrganization(organizationId, employeeId);

  if (!existing) {
    return { ok: false, message: "Employee not found" };
  }

  try {
    await db
      .delete(digitalEmployee)
      .where(eq(digitalEmployee.id, employeeId));

    return { ok: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete employee";
    return { ok: false, message };
  }
}
