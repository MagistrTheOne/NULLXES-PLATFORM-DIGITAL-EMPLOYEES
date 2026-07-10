import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";

/**
 * Published CEO / platform digital employees shared with Evaluation (free) orgs.
 * Rows reference a real digital_employee; free users Talk/chat but cannot edit.
 */
export const platformEmployeeCatalog = pgTable(
  "platform_employee_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => digitalEmployee.id, { onDelete: "cascade" }),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("platform_employee_catalog_employee_uidx").on(table.employeeId),
  ],
);
