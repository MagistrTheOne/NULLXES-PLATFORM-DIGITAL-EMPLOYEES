import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { deleteAnamEmployeeResources } from "@/features/provider-provisioning/services/delete-anam-employee-resources";
import { db } from "@/shared/db/client";
import { withTenantContext } from "@/shared/db/with-tenant-context";
import { assertEmployeeWritableInOrg } from "./platform-employee-catalog";

export async function deleteEmployee(
  organizationId: string,
  employeeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const writable = await assertEmployeeWritableInOrg(
    organizationId,
    employeeId,
  );
  if (!writable.ok) {
    return writable;
  }

  const [existing] = await db
    .select()
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.id, employeeId),
        eq(digitalEmployee.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!existing) {
    return { ok: false, message: "Employee not found" };
  }

  await deleteAnamEmployeeResources({
    employeeId,
    avatarProvider: existing.avatarProvider,
  });

  try {
    await withTenantContext(organizationId, async (tx) => {
      await tx
        .delete(digitalEmployee)
        .where(
          and(
            eq(digitalEmployee.id, employeeId),
            eq(digitalEmployee.organizationId, organizationId),
          ),
        );
    });

    return { ok: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete employee";
    return { ok: false, message };
  }
}
