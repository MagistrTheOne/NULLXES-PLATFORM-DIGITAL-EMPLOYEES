import { eq } from "drizzle-orm";
import { createMembership } from "@/entities/membership/create-membership";
import { membership } from "@/entities/membership/schema";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import { account, session, verification } from "./schema";
import { auth } from "./server";
import { GET, POST } from "./api/handler";

const TEST_USER_ID = "identity-verify-test-user";

async function verifyIdentity(): Promise<void> {
  if (!auth?.api) {
    throw new Error("Better Auth did not boot");
  }
  if (typeof GET !== "function" || typeof POST !== "function") {
    throw new Error("Auth API handlers are not exported");
  }
  console.log("Better Auth: booted");

  await db.select().from(session).limit(1);
  await db.select().from(account).limit(1);
  await db.select().from(verification).limit(1);
  await db.select().from(user).limit(1);
  console.log("Auth tables: accessible");

  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Identity Verify",
      email: "identity-verify@nullxes.local",
      emailVerified: false,
      status: "active",
    });
  }
  console.log("Test user: ready");

  const org = await createOrganization({
    name: "NULLXES Verify Org",
    slug: `verify-org-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });
  console.log("Organization: created");

  const ownerMembership = await createMembership({
    userId: TEST_USER_ID,
    organizationId: org.id,
    role: "owner",
  });
  console.log("Membership: created (owner)");

  const memberships = await db
    .select()
    .from(membership)
    .where(eq(membership.userId, TEST_USER_ID));

  if (memberships.length < 1) {
    throw new Error("User has no memberships");
  }

  const org2 = await createOrganization({
    name: "NULLXES Verify Org 2",
    slug: `verify-org-2-${Date.now()}`,
    type: "government",
    status: "active",
  });

  await createMembership({
    userId: TEST_USER_ID,
    organizationId: org2.id,
    role: "viewer",
  });
  console.log("Multi-org tenancy: user belongs to multiple organizations");

  try {
    await createMembership({
      userId: TEST_USER_ID,
      organizationId: org.id,
      role: "admin",
    });
    throw new Error("Duplicate membership should have failed");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Duplicate membership should have failed")) {
      throw error;
    }
    console.log("Duplicate membership constraint: enforced");
  }

  if (!ownerMembership.id) {
    throw new Error("Owner membership missing id");
  }

  console.log("Identity verification: OK");
}

verifyIdentity().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Identity verification failed:", message);
  process.exit(1);
});
