import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  avatarProviderEnum,
  brainProviderEnum,
  digitalEmployee,
} from "@/entities/digital-employee/schema";

export const employeeRuntime = pgTable(
  "employee_runtime",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => digitalEmployee.id, { onDelete: "cascade" }),
    brainProvider: brainProviderEnum("brain_provider").notNull(),
    avatarProvider: avatarProviderEnum("avatar_provider").notNull(),
    systemPrompt: text("system_prompt").notNull(),
    temperature: real("temperature").notNull().default(0.7),
    maxTokens: integer("max_tokens").notNull().default(4096),
    sessionLimitSeconds: integer("session_limit_seconds").notNull().default(3600),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("employee_runtime_employee_id_unique").on(table.employeeId)],
);
