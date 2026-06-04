import { relations } from "drizzle-orm";
import { membership } from "@/entities/membership/schema";
import { user } from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  memberships: many(membership),
}));
