import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeSession } from "@/entities/session/schema";
import type { TalkTurnFlags, TalkTurnSpans } from "@/features/runtime-session/types/talk-turn-metrics";

export const employeeSessionTurn = pgTable("employee_session_turn", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => employeeSession.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => digitalEmployee.id, { onDelete: "cascade" }),
  turnId: uuid("turn_id").notNull().unique(),
  voiceMode: text("voice_mode"),
  spans: jsonb("spans").$type<TalkTurnSpans>().notNull().default({}),
  flags: jsonb("flags").$type<TalkTurnFlags>().notNull().default({}),
  e2eMs: integer("e2e_ms"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
