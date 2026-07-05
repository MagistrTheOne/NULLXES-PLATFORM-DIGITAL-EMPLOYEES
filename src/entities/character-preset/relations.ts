import { relations } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { characterPreset } from "./schema";

export const characterPresetRelations = relations(characterPreset, ({ one }) => ({
  organization: one(organization, {
    fields: [characterPreset.organizationId],
    references: [organization.id],
  }),
}));
