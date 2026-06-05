import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization } from "@/entities/organization/schema";

export const integrationProviderEnum = pgEnum("integration_provider", [
  "slack",
  "teams",
]);

export const integrationConnectionStatusEnum = pgEnum(
  "integration_connection_status",
  ["connected", "disconnected", "error"],
);

export const integrationConnection = pgTable("integration_connection", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  provider: integrationProviderEnum("provider").notNull(),
  status: integrationConnectionStatusEnum("status")
    .notNull()
    .default("disconnected"),
  externalAccountId: text("external_account_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  connectedAt: timestamp("connected_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
