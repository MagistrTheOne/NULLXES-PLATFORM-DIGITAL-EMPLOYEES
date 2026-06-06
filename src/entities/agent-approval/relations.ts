import { relations } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeTask } from "@/entities/task/schema";
import { user } from "@/entities/user/schema";
import { agentApprovalRequest } from "./schema";

export const agentApprovalRequestRelations = relations(
  agentApprovalRequest,
  ({ one }) => ({
    organization: one(organization, {
      fields: [agentApprovalRequest.organizationId],
      references: [organization.id],
    }),
    employee: one(digitalEmployee, {
      fields: [agentApprovalRequest.employeeId],
      references: [digitalEmployee.id],
    }),
    task: one(employeeTask, {
      fields: [agentApprovalRequest.taskId],
      references: [employeeTask.id],
    }),
    reviewer: one(user, {
      fields: [agentApprovalRequest.reviewerUserId],
      references: [user.id],
    }),
  }),
);
