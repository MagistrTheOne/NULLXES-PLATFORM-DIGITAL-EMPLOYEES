import { and, count, eq } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";

export async function getActiveSessionCount(
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(employeeSession)
    .where(
      and(
        eq(employeeSession.organizationId, organizationId),
        eq(employeeSession.status, "active"),
      ),
    );

  return Number(row?.total ?? 0);
}
