import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { employeeSession } from "@/entities/session/schema";

export const sessionMessageRoleEnum = pgEnum("session_message_role", [
  "user",
  "assistant",
  "system",
]);

export const employeeSessionMessage = pgTable("employee_session_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => employeeSession.id, { onDelete: "cascade" }),
  role: sessionMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  sequence: integer("sequence").notNull(),
  streamMessageId: text("stream_message_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
