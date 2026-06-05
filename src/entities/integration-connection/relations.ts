import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { integrationConnection } from "./schema";

export const integrationConnectionRelations = relations(
  integrationConnection,
  ({ one }) => ({
    organization: one(organization, {
      fields: [integrationConnection.organizationId],
      references: [organization.id],
    }),
  }),
);
