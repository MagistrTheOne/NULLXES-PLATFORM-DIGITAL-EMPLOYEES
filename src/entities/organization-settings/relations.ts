import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { organizationSettings } from "./schema";

export const organizationSettingsRelations = relations(
  organizationSettings,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationSettings.organizationId],
      references: [organization.id],
    }),
  }),
);
