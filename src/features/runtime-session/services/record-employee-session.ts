import { and, desc, eq, inArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import { db } from "@/shared/db/client";
import { applySessionDurationLimit } from "./enforce-session-limit";
import { getEmployeeSessionLimitSeconds } from "./get-employee-session-limit";

function assertValidSatisfactionRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Satisfaction rating must be an integer from 1 to 5");
  }
}

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

export async function validateEmployeeSessionAccess(input: {
  sessionId: string;
  organizationId: string;
  employeeId: string;
  userId: string;
}): Promise<boolean> {
  try {
    const row = await assertSessionOwnership(
      input.sessionId,
      input.organizationId,
      input.userId,
    );
    return row.employeeId === input.employeeId;
  } catch {
    return false;
  }
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

  const findOpenSession = async (): Promise<string | null> => {
    const [open] = await db
      .select({ id: employeeSession.id })
      .from(employeeSession)
      .where(
        and(
          eq(employeeSession.employeeId, input.employeeId),
          eq(employeeSession.userId, input.userId),
          inArray(employeeSession.status, ["created", "active"]),
        ),
      )
      .orderBy(desc(employeeSession.createdAt))
      .limit(1);
    return open?.id ?? null;
  };

  // Fast path: reuse an already-open session.
  const existingOpenId = await findOpenSession();
  if (existingOpenId) {
    return existingOpenId;
  }

  // Atomic create. The neon-http driver has no interactive transactions, so the
  // reuse check above is a check-then-act race: two concurrent starts can both
  // see no open session. The partial unique index
  // (employee_session_open_unique on employee_id+user_id where status in
  // created/active) makes only one INSERT win; the loser gets no row back and
  // reuses the winner's session below.
  const [created] = await db
    .insert(employeeSession)
    .values({
      employeeId: input.employeeId,
      userId: input.userId,
      status: "created",
    })
    .onConflictDoNothing()
    .returning({ id: employeeSession.id });

  if (created) {
    return created.id;
  }

  // Lost the race: a concurrent request created the open session first.
  const raceWinnerId = await findOpenSession();
  if (raceWinnerId) {
    return raceWinnerId;
  }

  throw new Error("Failed to create employee session");
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
  satisfactionRating?: number;
}): Promise<CompleteEmployeeSessionResult | null> {
  if (input.satisfactionRating !== undefined) {
    assertValidSatisfactionRating(input.satisfactionRating);
  }

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
      ...(input.satisfactionRating !== undefined
        ? { satisfactionRating: String(input.satisfactionRating) }
        : {}),
    })
    .where(eq(employeeSession.id, input.sessionId));

  return {
    limitExceeded: limited.limitExceeded,
    employeeId: row.employeeId,
    durationSeconds: limited.durationSeconds,
    status:
      limited.status === "expired" ? "expired" : "completed",
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
