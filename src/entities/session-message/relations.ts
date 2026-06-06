import { relations } from "drizzle-orm";
import { employeeSession } from "@/entities/session/schema";
import { employeeSessionMessage } from "./schema";

export const employeeSessionMessageRelations = relations(
  employeeSessionMessage,
  ({ one }) => ({
    session: one(employeeSession, {
      fields: [employeeSessionMessage.sessionId],
      references: [employeeSession.id],
    }),
  }),
);
