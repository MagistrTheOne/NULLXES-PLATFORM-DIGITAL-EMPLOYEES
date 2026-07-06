import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

export const userConsentTypeEnum = pgEnum("user_consent_type", [
  "personal_data_processing",
  "terms_of_service",
]);

/** Immutable consent journal (152-FZ). Inserts only — no updates. */
export const userConsent = pgTable("user_consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").references(() => organization.id, {
    onDelete: "set null",
  }),
  consentType: userConsentTypeEnum("consent_type").notNull(),
  policyVersion: text("policy_version").notNull(),
  policyUrl: text("policy_url").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
