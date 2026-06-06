import { relations } from "drizzle-orm";
import { auditEvent } from "./schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";

export const auditEventRelations = relations(auditEvent, ({ one }) => ({
  organization: one(organization, {
    fields: [auditEvent.organizationId],
    references: [organization.id],
  }),
  actor: one(user, {
    fields: [auditEvent.actorUserId],
    references: [user.id],
  }),
}));
