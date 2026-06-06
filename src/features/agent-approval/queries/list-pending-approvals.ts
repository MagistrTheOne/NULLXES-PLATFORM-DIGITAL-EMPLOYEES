import { and, desc, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";

export type PendingApprovalRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  taskId: string | null;
  actionType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date | null;
};

export async function listPendingApprovals(
  organizationId: string,
): Promise<PendingApprovalRow[]> {
  const rows = await db
    .select({
      id: agentApprovalRequest.id,
      employeeId: agentApprovalRequest.employeeId,
      employeeName: digitalEmployee.name,
      taskId: agentApprovalRequest.taskId,
      actionType: agentApprovalRequest.actionType,
      payload: agentApprovalRequest.payload,
      createdAt: agentApprovalRequest.createdAt,
      expiresAt: agentApprovalRequest.expiresAt,
    })
    .from(agentApprovalRequest)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, agentApprovalRequest.employeeId),
    )
    .where(
      and(
        eq(agentApprovalRequest.organizationId, organizationId),
        eq(agentApprovalRequest.status, "pending"),
      ),
    )
    .orderBy(desc(agentApprovalRequest.createdAt))
    .limit(20);

  return rows.map((row) => ({
    ...row,
    payload: row.payload ?? {},
  }));
}
