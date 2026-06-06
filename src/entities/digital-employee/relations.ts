import { relations } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { employeeHandoff } from "@/entities/employee-handoff/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { employeeSession } from "@/entities/session/schema";
import { employeeTask } from "@/entities/task/schema";
import { employeeWorkEvent } from "@/entities/work-event/schema";
import { organization } from "@/entities/organization/schema";
import { digitalEmployee } from "./schema";

export const digitalEmployeeRelations = relations(
  digitalEmployee,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [digitalEmployee.organizationId],
      references: [organization.id],
    }),
    knowledgeSources: many(knowledgeSource),
    runtime: one(employeeRuntime, {
      fields: [digitalEmployee.id],
      references: [employeeRuntime.employeeId],
    }),
    employeeSessions: many(employeeSession),
    lifecycleEvents: many(employeeLifecycleEvent),
    providerConfigs: many(employeeProviderConfig),
    tasks: many(employeeTask),
    workEvents: many(employeeWorkEvent),
    approvalRequests: many(agentApprovalRequest),
    handoffsFrom: many(employeeHandoff, { relationName: "handoffFrom" }),
    handoffsTo: many(employeeHandoff, { relationName: "handoffTo" }),
  }),
);
