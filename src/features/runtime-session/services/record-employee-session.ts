import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSession } from "@/entities/session/schema";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { isPublishedPlatformCatalogEmployee } from "@/features/employees/services/platform-employee-catalog";
import { db } from "@/shared/db/client";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { applySessionDurationLimit } from "./enforce-session-limit";
import { getEmployeeSessionLimitSeconds } from "./get-employee-session-limit";
import {
  EmployeeSessionLimitError,
  MAX_OPEN_SESSIONS_PER_USER,
  MAX_OPEN_SESSIONS_PER_CATALOG_EMPLOYEE,
} from "../lib/employee-session-limit";

function assertValidSatisfactionRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Satisfaction rating must be an integer from 1 to 5");
  }
}

async function callerCanAccessEmployeeSession(input: {
  employeeOrganizationId: string;
  callerOrganizationId: string;
  employeeId: string;
}): Promise<boolean> {
  if (input.employeeOrganizationId === input.callerOrganizationId) {
    return true;
  }

  const [callerOrg] = await db
    .select({ billingPlan: organization.billingPlan })
    .from(organization)
    .where(eq(organization.id, input.callerOrganizationId))
    .limit(1);
  const callerPlan = resolveBillingPlanId(callerOrg?.billingPlan ?? "free");
  return (
    !planAllowsCreateEmployees(callerPlan) &&
    (await isPublishedPlatformCatalogEmployee(input.employeeId))
  );
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

  if (!row?.employee) {
    throw new Error("Session not found");
  }

  const allowed = await callerCanAccessEmployeeSession({
    employeeOrganizationId: row.employee.organizationId,
    callerOrganizationId: organizationId,
    employeeId: row.employeeId,
  });
  if (!allowed) {
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
    where: eq(digitalEmployee.id, input.employeeId),
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const allowed = await callerCanAccessEmployeeSession({
    employeeOrganizationId: employee.organizationId,
    callerOrganizationId: input.organizationId,
    employeeId: input.employeeId,
  });
  if (!allowed) {
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

  const findOpenSessionInTx = async (
    tx: Parameters<Parameters<typeof dbWithTransactions.transaction>[0]>[0],
  ): Promise<string | null> => {
    const [open] = await tx
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

  return dbWithTransactions.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${input.userId}))`,
    );

    const openForEmployee = await findOpenSessionInTx(tx);
    if (openForEmployee) {
      return openForEmployee;
    }

    const [openCountRow] = await tx
      .select({ total: count() })
      .from(employeeSession)
      .where(
        and(
          eq(employeeSession.userId, input.userId),
          inArray(employeeSession.status, ["created", "active"]),
        ),
      );

    if (Number(openCountRow?.total ?? 0) >= MAX_OPEN_SESSIONS_PER_USER) {
      throw new EmployeeSessionLimitError();
    }

    if (await isPublishedPlatformCatalogEmployee(input.employeeId)) {
      const [catalogOpenRow] = await tx
        .select({ total: count() })
        .from(employeeSession)
        .where(
          and(
            eq(employeeSession.employeeId, input.employeeId),
            inArray(employeeSession.status, ["created", "active"]),
          ),
        );
      if (
        Number(catalogOpenRow?.total ?? 0) >=
        MAX_OPEN_SESSIONS_PER_CATALOG_EMPLOYEE
      ) {
        throw new EmployeeSessionLimitError(
          "This NULLXES beta employee is at capacity. Try again shortly or pick another employee.",
        );
      }
    }

    // Partial unique index (employee_id+user_id where open) makes same-employee
    // races safe via ON CONFLICT DO NOTHING; the advisory lock above serializes
    // the cross-employee open-session cap per user.
    const [created] = await tx
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

    const raceWinnerId = await findOpenSessionInTx(tx);
    if (raceWinnerId) {
      return raceWinnerId;
    }

    throw new Error("Failed to create employee session");
  });
}

export async function activateEmployeeSession(input: {
  sessionId: string;
  organizationId: string;
  userId: string;
}): Promise<{ employeeId: string } | null> {
  const row = await assertSessionOwnership(
    input.sessionId,
    input.organizationId,
    input.userId,
  );

  await db
    .update(employeeSession)
    .set({ status: "active" })
    .where(eq(employeeSession.id, input.sessionId));

  return { employeeId: row.employeeId };
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
