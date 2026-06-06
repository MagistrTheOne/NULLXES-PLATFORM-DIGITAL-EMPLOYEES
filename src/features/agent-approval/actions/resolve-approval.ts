"use server";

import { and, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { employeeTask } from "@/entities/task/schema";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { recordWorkEvent } from "@/features/work-event";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { db } from "@/shared/db/client";

export async function resolveApprovalAction(input: {
  approvalId: string;
  decision: "approved" | "rejected";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageOrganization",
    );

    const [approval] = await db
      .select()
      .from(agentApprovalRequest)
      .where(
        and(
          eq(agentApprovalRequest.id, input.approvalId),
          eq(agentApprovalRequest.organizationId, workspace.organization.id),
          eq(agentApprovalRequest.status, "pending"),
        ),
      )
      .limit(1);

    if (!approval) {
      return { ok: false, message: "Approval request not found" };
    }

    await db
      .update(agentApprovalRequest)
      .set({
        status: input.decision,
        reviewerUserId: workspace.user.id,
        resolvedAt: new Date(),
      })
      .where(eq(agentApprovalRequest.id, approval.id));

    await recordWorkEvent({
      organizationId: workspace.organization.id,
      employeeId: approval.employeeId,
      taskId: approval.taskId ?? undefined,
      eventType: "approval_resolved",
      title: `Approval ${input.decision}`,
      summary: approval.actionType,
      metadata: { approvalId: approval.id, decision: input.decision },
    });

    if (input.decision === "approved" && approval.taskId) {
      await db
        .update(employeeTask)
        .set({ status: "pending" })
        .where(eq(employeeTask.id, approval.taskId));

      if (isInngestEnabledForSend()) {
        await inngest.send({
          name: "employee/task.received",
          data: {
            taskId: approval.taskId,
            organizationId: workspace.organization.id,
          },
        });
      }
    } else if (input.decision === "rejected" && approval.taskId) {
      await db
        .update(employeeTask)
        .set({ status: "cancelled", completedAt: new Date() })
        .where(eq(employeeTask.id, approval.taskId));
    }

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
