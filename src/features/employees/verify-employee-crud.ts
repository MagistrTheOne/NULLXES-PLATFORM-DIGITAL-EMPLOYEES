import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { createDigitalEmployee } from "@/features/employee";
import { db } from "@/shared/db/client";
import { deleteEmployee } from "./services/delete-employee";
import { updateEmployee } from "./services/update-employee";

const TEST_USER_ID = "employee-crud-verify-user";

async function ensureTestUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Employee CRUD Verify User",
      email: "employee-crud-verify@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }
}

async function verifyEmployeeCrud(): Promise<void> {
  await ensureTestUser();

  const org = await createOrganization({
    name: "Employee CRUD Verify Org",
    slug: `employee-crud-verify-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const created = await createDigitalEmployee({
    organizationId: org.id,
    actorUserId: TEST_USER_ID,
    name: "Kaira",
    role: "Customer Support Employee",
    description: "Support digital employee",
    avatarProvider: "anam",
    brainProvider: "openai",
    systemPrompt: "You are Kaira, a customer support employee.",
    reason: "CRUD verification seed",
  });

  const employeeId = created.employee.id;
  console.log("Create: digital employee row persisted");

  const updateResult = await updateEmployee({
    organizationId: org.id,
    employeeId,
    actorUserId: TEST_USER_ID,
    name: "Kaira Updated",
    role: "Senior Support Employee",
    description: "Updated description",
    status: "active",
    systemPrompt: "You are Kaira, a senior support employee.",
  });

  if (!updateResult.ok) {
    throw new Error(`Update failed: ${updateResult.message}`);
  }

  const [updatedEmployee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  const [updatedRuntime] = await db
    .select()
    .from(employeeRuntime)
    .where(eq(employeeRuntime.employeeId, employeeId))
    .limit(1);

  if (updatedEmployee?.name !== "Kaira Updated") {
    throw new Error("Employee name was not updated in database");
  }

  if (updatedEmployee?.status !== "active") {
    throw new Error("Employee status was not updated in database");
  }

  if (updatedRuntime?.systemPrompt !== "You are Kaira, a senior support employee.") {
    throw new Error("Runtime system prompt was not updated in database");
  }

  const lifecycleRows = await db
    .select()
    .from(employeeLifecycleEvent)
    .where(eq(employeeLifecycleEvent.employeeId, employeeId));

  if (lifecycleRows.length < 2) {
    throw new Error("Expected lifecycle events after create and update");
  }

  console.log("Update: profile, runtime, and lifecycle synced");

  const deleteResult = await deleteEmployee(org.id, employeeId);

  if (!deleteResult.ok) {
    throw new Error(`Delete failed: ${deleteResult.message}`);
  }

  const [deletedEmployee] = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (deletedEmployee) {
    throw new Error("Employee row still exists after delete");
  }

  const remainingLifecycle = await db
    .select()
    .from(employeeLifecycleEvent)
    .where(eq(employeeLifecycleEvent.employeeId, employeeId));

  if (remainingLifecycle.length > 0) {
    throw new Error("Lifecycle rows were not cascade-deleted");
  }

  console.log("Delete: employee and related rows removed via cascade");
  console.log("Employee CRUD verification passed");
}

verifyEmployeeCrud().catch((error: unknown) => {
  console.error("Employee CRUD verification failed", error);
  process.exit(1);
});
