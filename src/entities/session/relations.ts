import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { organization } from "@/entities/organization/schema";
import { employeeSessionMessage } from "@/entities/session-message/schema";
import { employeeSessionTurn } from "@/entities/session-turn/schema";
import { user } from "@/entities/user/schema";
import { employeeSession } from "./schema";

export const employeeSessionRelations = relations(
  employeeSession,
  ({ one, many }) => ({
    employee: one(digitalEmployee, {
      fields: [employeeSession.employeeId],
      references: [digitalEmployee.id],
    }),
    organization: one(organization, {
      fields: [employeeSession.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [employeeSession.userId],
      references: [user.id],
    }),
    summaryKnowledgeSource: one(knowledgeSource, {
      fields: [employeeSession.summaryKnowledgeSourceId],
      references: [knowledgeSource.id],
    }),
    messages: many(employeeSessionMessage),
    turns: many(employeeSessionTurn),
  }),
);
