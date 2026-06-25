import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "@/entities/organization/schema";

export const employeeStatusEnum = pgEnum("employee_status", [
  "draft",
  "active",
  "paused",
  "archived",
]);

export const avatarProviderEnum = pgEnum("avatar_provider", [
  "anam",
  "nullxes",
  "custom",
]);

export const brainProviderEnum = pgEnum("brain_provider", [
  "openai",
  "anthropic",
  "google",
  "nullxes",
]);

export const digitalEmployee = pgTable("digital_employee", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  role: text("role").notNull(),
  department: text("department"),
  status: employeeStatusEnum("status").notNull().default("draft"),
  avatarProvider: avatarProviderEnum("avatar_provider").notNull(),
  brainProvider: brainProviderEnum("brain_provider").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
