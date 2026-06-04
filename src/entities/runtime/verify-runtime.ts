import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { db } from "@/shared/db/client";
import { employeeRuntime } from "./schema";

const SYSTEM_PROMPT =
  "You are a NULLXES Digital Employee. Follow organization policies.";

async function verifyRuntime(): Promise<void> {
  await db.select().from(employeeRuntime).limit(1);
  console.log("employee_runtime table: accessible");

  const org = await createOrganization({
    name: "NULLXES Runtime Verify Org",
    slug: `runtime-verify-org-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Atlas",
      description: "Runtime verify fixture employee",
      role: "Automation Engineer",
      status: "draft",
      avatarProvider: "anam",
      brainProvider: "openai",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee");
  }
  console.log("Digital employee: created");

  const [runtime] = await db
    .insert(employeeRuntime)
    .values({
      employeeId: employee.id,
      brainProvider: "openai",
      avatarProvider: "anam",
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 4096,
      sessionLimitSeconds: 1800,
      isActive: true,
    })
    .returning();

  if (!runtime) {
    throw new Error("Failed to create employee runtime");
  }

  if (
    runtime.systemPrompt !== SYSTEM_PROMPT ||
    runtime.sessionLimitSeconds !== 1800 ||
    runtime.brainProvider !== "openai" ||
    runtime.avatarProvider !== "anam"
  ) {
    throw new Error("Runtime configuration values were not stored correctly");
  }
  console.log("Employee runtime: created with configuration");

  const employeeWithRuntime = await db.query.digitalEmployee.findFirst({
    where: eq(digitalEmployee.id, employee.id),
    with: { runtime: true },
  });

  if (!employeeWithRuntime?.runtime || employeeWithRuntime.runtime.id !== runtime.id) {
    throw new Error("Digital employee runtime relation is invalid");
  }
  console.log("Runtime relation: valid");

  const retrieved = await db.query.employeeRuntime.findFirst({
    where: eq(employeeRuntime.id, runtime.id),
    with: { employee: true },
  });

  if (!retrieved?.employee || retrieved.employee.id !== employee.id) {
    throw new Error("Runtime retrieval failed");
  }
  console.log("Runtime retrieval: valid");

  try {
    await db.insert(employeeRuntime).values({
      employeeId: employee.id,
      brainProvider: "anthropic",
      avatarProvider: "custom",
      systemPrompt: "Duplicate runtime",
      temperature: 0.5,
      maxTokens: 1024,
      sessionLimitSeconds: 600,
      isActive: false,
    });
    throw new Error("Duplicate runtime for same employee should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Duplicate runtime for same employee should have failed")) {
      throw error;
    }
    console.log("One runtime per employee: enforced");
  }

  console.log("Runtime verification: OK");
}

verifyRuntime().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Runtime verification failed:", message);
  process.exit(1);
});
