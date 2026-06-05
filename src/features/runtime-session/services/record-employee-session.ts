import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { applySessionDurationLimit } from "./enforce-session-limit";
import { getEmployeeSessionLimitSeconds } from "./get-employee-session-limit";

async function assertSessionOwnership(
  sessionId: string,
  organizationId: string,
  userId: string,
): Promise<typeof employeeSession.$inferSelect> {
  const row = await db.query.employeeSession.findFirst({
    where: eq(employeeSession.id, sessionId),
    with: { employee: true },
  });

  if (!row?.employee || row.employee.organizationId !== organizationId) {
    throw new Error("Session not found");
  }

  if (row.userId !== userId) {
    throw new Error("Session access denied");
  }

  return row;
}

export async function startEmployeeSession(input: {
  organizationId: string;
  employeeId: string;
  userId: string;
}): Promise<string> {
  const employee = await db.query.digitalEmployee.findFirst({
    where: and(
      eq(digitalEmployee.id, input.employeeId),
      eq(digitalEmployee.organizationId, input.organizationId),
    ),
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const [session] = await db
    .insert(employeeSession)
    .values({
      employeeId: input.employeeId,
      userId: input.userId,
      status: "created",
    })
    .returning({ id: employeeSession.id });

  if (!session) {
    throw new Error("Failed to create employee session");
  }

  return session.id;
}

export async function activateEmployeeSession(input: {
  sessionId: string;
  organizationId: string;
  userId: string;
}): Promise<void> {
  await assertSessionOwnership(
    input.sessionId,
    input.organizationId,
    input.userId,
  );

  await db
    .update(employeeSession)
    .set({ status: "active" })
    .where(eq(employeeSession.id, input.sessionId));
}

export type CompleteEmployeeSessionResult = {
  limitExceeded: boolean;
  employeeId: string;
  durationSeconds: number;
  status: "completed" | "expired";
};

export async function completeEmployeeSession(input: {
  sessionId: string;
  organizationId: string;
  userId: string;
  startedAt?: Date;
}): Promise<CompleteEmployeeSessionResult | null> {
  const row = await assertSessionOwnership(
    input.sessionId,
    input.organizationId,
    input.userId,
  );

  if (row.status === "completed" || row.status === "failed" || row.status === "expired") {
    return null;
  }

  const endedAt = new Date();
  const startedAt = input.startedAt ?? row.startedAt;
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
    .where(eq(employeeSession.id, input.sessionId));

  return {
    limitExceeded: limited.limitExceeded,
    employeeId: row.employeeId,
    durationSeconds: limited.durationSeconds,
    status: limited.status,
  };
}

export async function failEmployeeSession(input: {
  sessionId: string;
  organizationId: string;
  userId: string;
}): Promise<void> {
  await assertSessionOwnership(
    input.sessionId,
    input.organizationId,
    input.userId,
  );

  await db
    .update(employeeSession)
    .set({
      status: "failed",
      endedAt: new Date(),
    })
    .where(eq(employeeSession.id, input.sessionId));
}
