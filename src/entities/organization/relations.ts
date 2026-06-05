import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organizationSettings } from "@/entities/organization-settings/schema";
import { membership } from "@/entities/membership/schema";
import { organization } from "./schema";

export const organizationRelations = relations(organization, ({ many, one }) => ({
  memberships: many(membership),
  digitalEmployees: many(digitalEmployee),
  settings: one(organizationSettings, {
    fields: [organization.id],
    references: [organizationSettings.organizationId],
  }),
}));
