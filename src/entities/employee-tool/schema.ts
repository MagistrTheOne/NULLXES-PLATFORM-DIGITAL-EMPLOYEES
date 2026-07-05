import { boolean, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { toolDefinition } from "@/entities/tool-definition/schema";

export const employeeTool = pgTable(
  "employee_tool",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => digitalEmployee.id, { onDelete: "cascade" }),
    toolDefinitionId: uuid("tool_definition_id")
      .notNull()
      .references(() => toolDefinition.id, { onDelete: "cascade" }),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("employee_tool_employee_tool_unique").on(
      table.employeeId,
      table.toolDefinitionId,
    ),
  ],
);
