import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { employeeSession } from "./schema";

const TEST_USER_ID = "session-verify-test-user";
const FAKE_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000010";
const FAKE_USER_ID = "session-verify-fake-user";

async function verifySession(): Promise<void> {
  await db.select().from(employeeSession).limit(1);
  console.log("employee_session table: accessible");

  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Session Verify User",
      email: "session-verify@nullxes.local",
      emailVerified: false,
      status: "active",
    });
  }
  console.log("User: ready");

  const org = await createOrganization({
    name: "NULLXES Session Verify Org",
    slug: `session-verify-org-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Megan",
      description: "Session verify fixture employee",
      role: "Legal Operations Employee",
      status: "active",
      avatarProvider: "nullxes",
      brainProvider: "anthropic",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee");
  }
  console.log("Digital employee: created");

  const startedAt = new Date("2026-01-01T10:00:00.000Z");
  const endedAt = new Date("2026-01-01T10:30:00.000Z");
  const durationSeconds = Math.round(
    (endedAt.getTime() - startedAt.getTime()) / 1000,
  );

  const [session] = await db
    .insert(employeeSession)
    .values({
      employeeId: employee.id,
      organizationId: org.id,
      userId: TEST_USER_ID,
      status: "created",
      startedAt,
    })
    .returning();

  if (!session) {
    throw new Error("Failed to create employee session");
  }

  const [completed] = await db
    .update(employeeSession)
    .set({
      status: "completed",
      endedAt,
      durationSeconds,
    })
    .where(eq(employeeSession.id, session.id))
    .returning();

  if (!completed) {
    throw new Error("Failed to update session status");
  }

  if (completed.status !== "completed") {
    throw new Error("Session status transition was not stored");
  }

  if (completed.durationSeconds !== durationSeconds) {
    throw new Error("Duration calculation was not stored correctly");
  }
  console.log("Employee session: created with status transition and duration");

  const withRelations = await db.query.employeeSession.findFirst({
    where: eq(employeeSession.id, session.id),
    with: { employee: true, user: true },
  });

  if (!withRelations?.employee || withRelations.employee.id !== employee.id) {
    throw new Error("Digital employee relation is invalid");
  }
  if (!withRelations?.user || withRelations.user.id !== TEST_USER_ID) {
    throw new Error("User relation is invalid");
  }
  console.log("Relations: employee and user valid");

  try {
    await db.insert(employeeSession).values({
      employeeId: FAKE_EMPLOYEE_ID,
      organizationId: org.id,
      userId: TEST_USER_ID,
      status: "created",
      startedAt: new Date(),
    });
    throw new Error("Insert without valid employee should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Insert without valid employee should have failed")) {
      throw error;
    }
    console.log("Employee FK constraint: enforced");
  }

  try {
    await db.insert(employeeSession).values({
      employeeId: employee.id,
      organizationId: org.id,
      userId: FAKE_USER_ID,
      status: "created",
      startedAt: new Date(),
    });
    throw new Error("Insert without valid user should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Insert without valid user should have failed")) {
      throw error;
    }
    console.log("User FK constraint: enforced");
  }

  console.log("Session verification: OK");
}

verifySession().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Session verification failed:", message);
  process.exit(1);
});
