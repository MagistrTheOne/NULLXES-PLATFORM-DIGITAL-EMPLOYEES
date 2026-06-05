import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import { exportJob } from "./schema";

export const exportJobRelations = relations(exportJob, ({ one }) => ({
  organization: one(organization, {
    fields: [exportJob.organizationId],
    references: [organization.id],
  }),
  requestedBy: one(user, {
    fields: [exportJob.requestedByUserId],
    references: [user.id],
  }),
}));
