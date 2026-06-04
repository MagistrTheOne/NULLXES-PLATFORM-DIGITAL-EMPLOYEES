import { asc, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { employeeLifecycleEvent } from "./schema";

const TEST_USER_ID = "lifecycle-verify-test-user";
const FAKE_EMPLOYEE_ID = "00000000-0000-0000-0000-000000000020";

async function verifyLifecycle(): Promise<void> {
  await db.select().from(employeeLifecycleEvent).limit(1);
  console.log("employee_lifecycle_event table: accessible");

  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Lifecycle Verify User",
      email: "lifecycle-verify@nullxes.local",
      emailVerified: false,
      status: "active",
    });
  }
  console.log("User: ready");

  const org = await createOrganization({
    name: "NULLXES Lifecycle Verify Org",
    slug: `lifecycle-verify-org-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Somnia",
      description: "Lifecycle verify fixture employee",
      role: "Enterprise Sales Employee",
      status: "draft",
      avatarProvider: "anam",
      brainProvider: "openai",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee");
  }
  console.log("Digital employee: created");

  const eventPayloads = [
    {
      eventType: "created" as const,
      reason: "Employee provisioned",
      metadata: { source: "verify-lifecycle" },
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
    },
    {
      eventType: "activated" as const,
      reason: "Approved for production",
      metadata: { previousStatus: "draft", nextStatus: "active" },
      createdAt: new Date("2026-02-01T11:00:00.000Z"),
    },
    {
      eventType: "runtime_updated" as const,
      reason: "Runtime configuration changed",
      metadata: { brainProvider: "openai" },
      createdAt: new Date("2026-02-01T12:00:00.000Z"),
    },
    {
      eventType: "paused" as const,
      reason: "Temporary suspension",
      metadata: { previousStatus: "active", nextStatus: "paused" },
      createdAt: new Date("2026-02-01T13:00:00.000Z"),
    },
  ];

  for (const payload of eventPayloads) {
    await db.insert(employeeLifecycleEvent).values({
      employeeId: employee.id,
      actorUserId: TEST_USER_ID,
      eventType: payload.eventType,
      reason: payload.reason,
      metadata: payload.metadata,
      createdAt: payload.createdAt,
    });
  }
  console.log("Lifecycle events: created");

  const history = await db
    .select()
    .from(employeeLifecycleEvent)
    .where(eq(employeeLifecycleEvent.employeeId, employee.id))
    .orderBy(asc(employeeLifecycleEvent.createdAt));

  if (history.length !== 4) {
    throw new Error("Lifecycle history retrieval returned unexpected count");
  }

  const eventOrder = history.map((event) => event.eventType);
  const expectedOrder = [
    "created",
    "activated",
    "runtime_updated",
    "paused",
  ];

  if (eventOrder.join(",") !== expectedOrder.join(",")) {
    throw new Error("Lifecycle event ordering is invalid");
  }
  console.log("Lifecycle ordering: valid");

  const employeeWithHistory = await db.query.digitalEmployee.findFirst({
    where: eq(digitalEmployee.id, employee.id),
    with: {
      lifecycleEvents: {
        orderBy: asc(employeeLifecycleEvent.createdAt),
        with: { actor: true },
      },
    },
  });

  if (
    !employeeWithHistory?.lifecycleEvents ||
    employeeWithHistory.lifecycleEvents.length !== 4
  ) {
    throw new Error("Employee lifecycle history relation is invalid");
  }

  if (
    employeeWithHistory.lifecycleEvents[0]?.actor?.id !== TEST_USER_ID
  ) {
    throw new Error("Actor user relation is invalid");
  }
  console.log("Relations and history retrieval: valid");

  try {
    await db.insert(employeeLifecycleEvent).values({
      employeeId: FAKE_EMPLOYEE_ID,
      actorUserId: TEST_USER_ID,
      eventType: "created",
      reason: "Invalid employee",
    });
    throw new Error("Insert without valid employee should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Insert without valid employee should have failed")) {
      throw error;
    }
    console.log("Employee FK constraint: enforced");
  }

  console.log("Lifecycle verification: OK");
}

verifyLifecycle().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Lifecycle verification failed:", message);
  process.exit(1);
});
