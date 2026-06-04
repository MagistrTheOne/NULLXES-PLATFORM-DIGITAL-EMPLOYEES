import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";

export const providerConfigTypeEnum = pgEnum("provider_config_type", [
  "avatar",
  "brain",
  "session",
]);

export const employeeProviderConfig = pgTable(
  "employee_provider_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => digitalEmployee.id, { onDelete: "cascade" }),
    providerType: providerConfigTypeEnum("provider_type").notNull(),
    providerId: text("provider_id").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("employee_provider_config_employee_type_unique").on(
      table.employeeId,
      table.providerType,
    ),
  ],
);
