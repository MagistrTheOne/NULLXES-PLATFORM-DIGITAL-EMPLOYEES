import { and, desc, eq, inArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { user } from "@/entities/user/schema";
import { applySessionDurationLimit } from "@/features/runtime-session/services/enforce-session-limit";
import { getEmployeeSessionLimitSeconds } from "@/features/runtime-session/services/get-employee-session-limit";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

const employeeName = process.argv[2] ?? "Somnia";
const shouldClose = process.argv.includes("--close");

async function main(): Promise<void> {
  const employees = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.name, employeeName));

  if (employees.length === 0) {
    console.log(`No employee named ${employeeName}`);
    return;
  }

  const employeeIds = employees.map((row) => row.id);
  const rows = await db
    .select({
      sessionId: employeeSession.id,
      employeeId: employeeSession.employeeId,
      employeeName: digitalEmployee.name,
      userEmail: user.email,
      status: employeeSession.status,
      startedAt: employeeSession.startedAt,
      endedAt: employeeSession.endedAt,
      durationSeconds: employeeSession.durationSeconds,
    })
    .from(employeeSession)
    .innerJoin(digitalEmployee, eq(employeeSession.employeeId, digitalEmployee.id))
    .innerJoin(user, eq(employeeSession.userId, user.id))
    .where(
      and(
        inArray(employeeSession.employeeId, employeeIds),
        inArray(employeeSession.status, ["created", "active"]),
      ),
    )
    .orderBy(desc(employeeSession.startedAt));

  if (rows.length === 0) {
    console.log(`No open sessions for ${employeeName}`);
    return;
  }

  for (const row of rows) {
    const elapsedMinutes = row.startedAt
      ? Math.floor((Date.now() - row.startedAt.getTime()) / 60000)
      : 0;
    console.log(
      JSON.stringify({
        sessionId: row.sessionId,
        employeeName: row.employeeName,
        userEmail: row.userEmail,
        status: row.status,
        startedAt: row.startedAt?.toISOString(),
        elapsedMinutes,
        elapsedHours: Number((elapsedMinutes / 60).toFixed(2)),
      }),
    );
  }

  if (!shouldClose) {
    console.log("Pass --close to complete these sessions.");
    return;
  }

  const endedAt = new Date();
  for (const row of rows) {
    const startedAt = row.startedAt ?? endedAt;
    const sessionLimitSeconds = await getEmployeeSessionLimitSeconds(row.employeeId);
    const limited = applySessionDurationLimit({
      startedAt,
      endedAt,
      sessionLimitSeconds,
    });

    await db
      .update(employeeSession)
      .set({
        status: limited.status,
        endedAt,
        durationSeconds: limited.durationSeconds,
      })
      .where(eq(employeeSession.id, row.sessionId));

    console.log(
      `Closed ${row.sessionId} as ${limited.status} (${limited.durationSeconds}s)`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
