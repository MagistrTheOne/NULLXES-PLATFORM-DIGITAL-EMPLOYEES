import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import {
  activateDigitalEmployee,
  createDigitalEmployee,
  pauseDigitalEmployee,
} from "./use-cases";

const TEST_USER_ID = "orchestration-verify-user";
const ROLLBACK_PROBE_NAME = "orchestration-rollback-probe";

async function ensureTestUser(): Promise<void> {
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Orchestration Verify User",
      email: "orchestration-verify@nullxes.local",
      emailVerified: false,
      status: "active",
    });
  }
}

async function verifyRollback(): Promise<void> {
  const org = await createOrganization({
    name: "NULLXES Rollback Org",
    slug: `orchestration-rollback-${Date.now()}`,
    type: "demo",
    status: "active",
  });

  try {
    await createDigitalEmployee({
      organizationId: org.id,
      actorUserId: "nonexistent-user-id",
      name: ROLLBACK_PROBE_NAME,
      role: "Rollback Probe",
      avatarProvider: "nullxes",
      brainProvider: "nullxes",
      systemPrompt: "probe",
    });
    throw new Error("Expected orchestration failure did not occur");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Expected orchestration failure did not occur")) {
      throw error;
    }
  }

  const employees = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.name, ROLLBACK_PROBE_NAME));

  if (employees.length > 0) {
    throw new Error("Rollback left partial employee records");
  }

  const runtimes = await db
    .select()
    .from(employeeRuntime)
    .where(eq(employeeRuntime.systemPrompt, "probe"));

  if (runtimes.length > 0) {
    throw new Error("Rollback left partial runtime records");
  }

  console.log("Transaction rollback: enforced");
}

async function verifyOrchestration(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "NULLXES Orchestration Org",
    slug: `orchestration-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });
  console.log("Organization: created");

  const created = await createDigitalEmployee({
    organizationId: org.id,
    actorUserId: TEST_USER_ID,
    name: "Lili",
    description: "Data analyst digital employee",
    role: "Data Analyst",
    avatarProvider: "anam",
    brainProvider: "openai",
    systemPrompt: "You are Lili, a NULLXES data analyst.",
    temperature: 0.5,
    maxTokens: 2048,
    sessionLimitSeconds: 7200,
    reason: "Provisioned via orchestration",
  });

  if (created.employee.status !== "draft") {
    throw new Error("Employee was not created in draft status");
  }
  if (created.runtime.employeeId !== created.employee.id) {
    throw new Error("Runtime was not linked to employee");
  }
  if (created.lifecycleEvent.eventType !== "created") {
    throw new Error("Lifecycle event was not recorded on create");
  }
  console.log("CreateDigitalEmployee: orchestrated employee, runtime, lifecycle");

  const activated = await activateDigitalEmployee({
    employeeId: created.employee.id,
    actorUserId: TEST_USER_ID,
    reason: "Ready for operations",
  });

  if (activated.employee.status !== "active") {
    throw new Error("ActivateDigitalEmployee did not update status");
  }
  console.log("ActivateDigitalEmployee: status and lifecycle updated");

  const paused = await pauseDigitalEmployee({
    employeeId: created.employee.id,
    actorUserId: TEST_USER_ID,
    reason: "Maintenance window",
  });

  if (paused.employee.status !== "paused") {
    throw new Error("PauseDigitalEmployee did not update status");
  }

  const events = await db
    .select()
    .from(employeeLifecycleEvent)
    .where(eq(employeeLifecycleEvent.employeeId, created.employee.id));

  if (events.length < 3) {
    throw new Error("Lifecycle history is incomplete");
  }
  console.log("Lifecycle history: recorded automatically");

  await verifyRollback();

  console.log("Employee orchestration verification: OK");
}

verifyOrchestration().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Employee orchestration verification failed:", message);
  process.exit(1);
});
