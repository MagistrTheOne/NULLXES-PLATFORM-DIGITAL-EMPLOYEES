import { eq } from "drizzle-orm";
import { employeeRuntime } from "@/entities/runtime/schema";
import { db } from "@/shared/db/client";

export async function getEmployeeSessionLimitSeconds(
  employeeId: string,
): Promise<number> {
  const [runtime] = await db
    .select({ sessionLimitSeconds: employeeRuntime.sessionLimitSeconds })
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, employeeId))
    .limit(1);

  return runtime?.sessionLimitSeconds ?? 3600;
}
