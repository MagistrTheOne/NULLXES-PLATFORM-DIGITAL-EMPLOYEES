import { eq } from "drizzle-orm";
import { employeeRuntime } from "@/entities/runtime/schema";
import { db } from "@/shared/db/client";

/**
 * Optional Talk video cap via TALK_DEMO_SESSION_CAP_SECONDS.
 * Off by default (null). Set a positive number to enable; 0/off/false = disabled.
 */
function resolveTempDemoSessionCapSeconds(): number | null {
  const raw = process.env.TALK_DEMO_SESSION_CAP_SECONDS?.trim();
  if (!raw || raw === "0" || raw === "off" || raw === "false") {
    return null;
  }

  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }

  return null;
}

export async function getEmployeeSessionLimitSeconds(
  employeeId: string,
): Promise<number> {
  const [runtime] = await db
    .select({ sessionLimitSeconds: employeeRuntime.sessionLimitSeconds })
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, employeeId))
    .limit(1);

  const stored = runtime?.sessionLimitSeconds ?? 3600;
  const demoCap = resolveTempDemoSessionCapSeconds();

  if (demoCap == null) {
    return stored;
  }

  return Math.min(stored, demoCap);
}
