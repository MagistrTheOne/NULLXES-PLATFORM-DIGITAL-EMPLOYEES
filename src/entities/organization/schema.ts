import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const organizationTypeEnum = pgEnum("organization_type", [
  "demo",
  "enterprise",
  "government",
]);

export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "suspended",
  "archived",
]);

export const organizationBillingPlanEnum = pgEnum("organization_billing_plan", [
  "free",
  "super_pro",
  "enterprise",
  "government",
]);

export const organization = pgTable("organization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: organizationTypeEnum("type").notNull(),
  status: organizationStatusEnum("status").notNull().default("active"),
  polarCustomerId: text("polar_customer_id"),
  billingPlan: organizationBillingPlanEnum("billing_plan")
    .notNull()
    .default("free"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
