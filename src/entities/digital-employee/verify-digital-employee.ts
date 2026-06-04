import { eq } from "drizzle-orm";
import { createOrganization } from "@/entities/organization/create-organization";
import { db } from "@/shared/db/client";
import { digitalEmployee } from "./schema";

const FAKE_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000000";

async function verifyDigitalEmployee(): Promise<void> {
  await db.select().from(digitalEmployee).limit(1);
  console.log("digital_employee table: accessible");

  const org = await createOrganization({
    name: "NULLXES Employee Verify Org",
    slug: `employee-verify-org-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });

  const [employee] = await db
    .insert(digitalEmployee)
    .values({
      organizationId: org.id,
      name: "Somnia",
      description: "Enterprise sales digital employee",
      role: "Enterprise Sales Employee",
      status: "draft",
      avatarProvider: "anam",
      brainProvider: "openai",
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create digital employee");
  }

  if (employee.avatarProvider !== "anam" || employee.brainProvider !== "openai") {
    throw new Error("Provider values were not stored correctly");
  }
  console.log("Digital employee: created with provider identifiers");

  const withOrganization = await db.query.digitalEmployee.findFirst({
    where: eq(digitalEmployee.id, employee.id),
    with: { organization: true },
  });

  if (!withOrganization?.organization || withOrganization.organization.id !== org.id) {
    throw new Error("Organization relation is invalid");
  }
  console.log("Organization relation: valid");

  try {
    await db.insert(digitalEmployee).values({
      organizationId: FAKE_ORGANIZATION_ID,
      name: "Invalid Employee",
      role: "Test Role",
      avatarProvider: "nullxes",
      brainProvider: "nullxes",
    });
    throw new Error("Insert without valid organization should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Insert without valid organization should have failed")) {
      throw error;
    }
    console.log("Organization FK constraint: enforced");
  }

  console.log("Digital employee verification: OK");
}

verifyDigitalEmployee().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Digital employee verification failed:", message);
  process.exit(1);
});
