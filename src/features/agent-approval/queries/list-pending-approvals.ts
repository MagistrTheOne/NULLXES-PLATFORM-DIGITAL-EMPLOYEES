import { and, desc, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import type { PendingApprovalRow } from "../types/pending-approval";

export type { PendingApprovalRow };

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
