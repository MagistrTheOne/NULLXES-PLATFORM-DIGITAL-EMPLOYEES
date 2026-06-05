import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { membershipRoleEnum } from "@/entities/membership/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

export const organizationInviteStatusEnum = pgEnum("organization_invite_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const organizationInvite = pgTable("organization_invite", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: membershipRoleEnum("role").notNull().default("viewer"),
  tokenHash: text("token_hash").notNull(),
  invitedByUserId: text("invited_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: organizationInviteStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
