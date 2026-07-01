import { eq } from "drizzle-orm";
import { employeeRuntime } from "@/entities/runtime/schema";
import { db } from "@/shared/db/client";

/** Temporary demo cap for live Talk video. Set TALK_DEMO_SESSION_CAP_SECONDS=0 to disable. */
function resolveTempDemoSessionCapSeconds(): number | null {
  const raw = process.env.TALK_DEMO_SESSION_CAP_SECONDS?.trim();
  if (raw === "0" || raw === "off" || raw === "false") {
    return null;
  }

  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return 120;
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
