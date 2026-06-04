import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { membership } from "@/entities/membership/schema";
import { organization } from "./schema";

export const organizationRelations = relations(organization, ({ many }) => ({
  memberships: many(membership),
  digitalEmployees: many(digitalEmployee),
}));
