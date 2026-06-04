import { relations } from "drizzle-orm";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { membership } from "@/entities/membership/schema";
import { employeeSession } from "@/entities/session/schema";
import { user } from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  memberships: many(membership),
  employeeSessions: many(employeeSession),
  lifecycleEventsActed: many(employeeLifecycleEvent),
}));
