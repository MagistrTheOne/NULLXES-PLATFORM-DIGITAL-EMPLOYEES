import { and, count, eq } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { withTenantContext } from "@/shared/db/with-tenant-context";

export async function getActiveSessionCount(
  organizationId: string,
): Promise<number> {
  return withTenantContext(organizationId, async (tx) => {
    const [row] = await tx
      .select({ total: count() })
      .from(employeeSession)
      .where(
        and(
          eq(employeeSession.organizationId, organizationId),
          eq(employeeSession.status, "active"),
        ),
      );

    return Number(row?.total ?? 0);
  });
}
