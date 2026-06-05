import { and, count, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";

export async function getActiveSessionCount(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(employeeSession)
    .innerJoin(
      digitalEmployee,
      eq(employeeSession.employeeId, digitalEmployee.id),
    )
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        eq(employeeSession.status, "active"),
      ),
    );

  return Number(row?.total ?? 0);
}
