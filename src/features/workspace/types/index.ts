import type { InferSelectModel } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

type Membership = InferSelectModel<typeof membership>;
type Organization = InferSelectModel<typeof organization>;
type User = InferSelectModel<typeof user>;

export type MembershipRole = Membership["role"];

export type WorkspacePermissions = {
  role: MembershipRole;
  canManageOrganization: boolean;
  canManageMembers: boolean;
  canManageEmployees: boolean;
  canOperateEmployees: boolean;
  canViewEmployees: boolean;
};

export type WorkspaceContext = {
  user: User;
  organization: Organization;
  membership: Membership;
  permissions: WorkspacePermissions;
};

export type ResolveWorkspaceInput = {
  userId: string;
};

export type WorkspaceAccessCheck = keyof Omit<
  WorkspacePermissions,
  "role"
>;
