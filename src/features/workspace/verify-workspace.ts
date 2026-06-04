import { eq } from "drizzle-orm";
import { createMembership } from "@/entities/membership/create-membership";
import { createOrganization } from "@/entities/organization/create-organization";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import {
  assertWorkspaceAccess,
  hasWorkspaceAccess,
  resolveWorkspace,
  resolveWorkspacePermissions,
} from "./services";

const TEST_USER_ID = "workspace-verify-user";

async function expectAccessDenied(
  label: string,
  action: () => void,
): Promise<void> {
  try {
    action();
    throw new Error(`${label}: expected access check to fail`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("expected access check to fail")) {
      throw error;
    }
    if (!message.includes("Workspace access denied")) {
      throw error;
    }
  }
  console.log(`${label}: denied`);
}

async function verifyWorkspaceFeature(): Promise<void> {
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Workspace Verify User",
      email: "workspace-verify@nullxes.local",
      emailVerified: true,
      status: "active",
    });
  }
  console.log("User: created");

  const primaryOrg = await createOrganization({
    name: "NULLXES Workspace Primary",
    slug: `workspace-primary-${Date.now()}`,
    type: "enterprise",
    status: "active",
  });
  console.log("Organization: created");

  await createMembership({
    userId: TEST_USER_ID,
    organizationId: primaryOrg.id,
    role: "owner",
  });
  console.log("Membership: created (owner)");

  const secondaryOrg = await createOrganization({
    name: "NULLXES Workspace Secondary",
    slug: `workspace-secondary-${Date.now()}`,
    type: "demo",
    status: "active",
  });

  await createMembership({
    userId: TEST_USER_ID,
    organizationId: secondaryOrg.id,
    role: "viewer",
  });
  console.log("Membership: created (viewer)");

  const workspace = await resolveWorkspace({ userId: TEST_USER_ID });

  if (workspace.user.id !== TEST_USER_ID) {
    throw new Error("Workspace user resolution failed");
  }

  if (workspace.organization.id !== primaryOrg.id) {
    throw new Error("Active workspace organization resolution failed");
  }

  if (workspace.membership.role !== "owner") {
    throw new Error("Active workspace role resolution failed");
  }

  if (!workspace.permissions.canManageOrganization) {
    throw new Error("Owner permissions were not resolved");
  }
  console.log("Workspace: resolved with owner context");

  assertWorkspaceAccess(workspace.permissions, "canManageEmployees");
  assertWorkspaceAccess(workspace.permissions, "canOperateEmployees");
  console.log("Access checks: owner allowed");

  const viewerPermissions = resolveWorkspacePermissions("viewer");

  await expectAccessDenied("viewer manage employees", () =>
    assertWorkspaceAccess(viewerPermissions, "canManageEmployees"),
  );

  if (!hasWorkspaceAccess(viewerPermissions, "canViewEmployees")) {
    throw new Error("Viewer should be able to view employees");
  }
  console.log("Role resolution: owner and viewer permissions verified");

  try {
    await resolveWorkspace({ userId: "nonexistent-workspace-user" });
    throw new Error("Resolve workspace should fail for unknown user");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Resolve workspace should fail for unknown user")) {
      throw error;
    }
    console.log("Access guard: unknown user rejected");
  }

  console.log("Workspace verification: OK");
}

verifyWorkspaceFeature().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Workspace verification failed:", message);
  process.exit(1);
});
