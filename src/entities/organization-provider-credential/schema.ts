import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

export const organizationProviderEnum = pgEnum("organization_provider", [
  "nullxes",
  "openai",
  "anthropic",
  "google",
]);

export const organizationProviderCredential = pgTable(
  "organization_provider_credential",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: organizationProviderEnum("provider").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    last4: text("last4").notNull(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("organization_provider_credential_org_provider_unique").on(
      table.organizationId,
      table.provider,
    ),
  ],
);
