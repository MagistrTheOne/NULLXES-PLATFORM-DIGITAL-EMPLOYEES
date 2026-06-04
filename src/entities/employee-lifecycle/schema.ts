import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { user } from "@/entities/user/schema";

export const employeeLifecycleEventTypeEnum = pgEnum(
  "employee_lifecycle_event_type",
  [
    "created",
    "activated",
    "paused",
    "archived",
    "runtime_updated",
    "knowledge_updated",
  ],
);

export const employeeLifecycleEvent = pgTable("employee_lifecycle_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  eventType: employeeLifecycleEventTypeEnum("event_type").notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
