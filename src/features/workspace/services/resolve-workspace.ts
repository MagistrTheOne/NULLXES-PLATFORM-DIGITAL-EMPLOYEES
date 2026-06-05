import { asc, eq } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { db } from "@/shared/db/client";
import type {
  MembershipRole,
  ResolveWorkspaceInput,
  WorkspaceContext,
} from "../types";
import { resolveWorkspacePermissions } from "./resolve-workspace-permissions";

const ROLE_PRIORITY: Record<MembershipRole, number> = {
  owner: 0,
  admin: 1,
  operator: 2,
  viewer: 3,
};

type MembershipWithOrganization = {
  membership: typeof membership.$inferSelect;
  organization: typeof organization.$inferSelect;
};

function selectActiveMembership(
  memberships: MembershipWithOrganization[],
): MembershipWithOrganization {
  const activeMemberships = memberships.filter(
    (entry) => entry.organization.status === "active",
  );

  if (activeMemberships.length === 0) {
    throw new Error("No active workspace membership found for user");
  }

  const sorted = [...activeMemberships].sort((left, right) => {
    const leftPersonalDemo =
      left.organization.type === "demo" && left.membership.role === "owner"
        ? 1
        : 0;
    const rightPersonalDemo =
      right.organization.type === "demo" && right.membership.role === "owner"
        ? 1
        : 0;

    if (leftPersonalDemo !== rightPersonalDemo) {
      return leftPersonalDemo - rightPersonalDemo;
    }

    const roleDifference =
      ROLE_PRIORITY[left.membership.role] -
      ROLE_PRIORITY[right.membership.role];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return (
      right.membership.createdAt.getTime() - left.membership.createdAt.getTime()
    );
  });

  return sorted[0]!;
}

export async function resolveWorkspace(
  input: ResolveWorkspaceInput,
): Promise<WorkspaceContext> {
  const [resolvedUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);

  if (!resolvedUser) {
    throw new Error("User not found");
  }

  const membershipRows = await db
    .select({
      membership,
      organization,
    })
    .from(membership)
    .innerJoin(organization, eq(membership.organizationId, organization.id))
    .where(eq(membership.userId, input.userId))
    .orderBy(asc(membership.createdAt));

  if (membershipRows.length === 0) {
    throw new Error("User has no workspace memberships");
  }

  const active = selectActiveMembership(membershipRows);

  return {
    user: resolvedUser,
    organization: active.organization,
    membership: active.membership,
    permissions: resolveWorkspacePermissions(active.membership.role),
  };
}
