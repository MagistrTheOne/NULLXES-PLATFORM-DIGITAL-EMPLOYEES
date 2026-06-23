"use server";

import { and, eq } from "drizzle-orm";
import { employeeHandoff } from "@/entities/employee-handoff/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeTask } from "@/entities/task/schema";
import { enqueueEmployeeTask } from "@/features/agent-tasks";
import { dispatchOrganizationWebhook } from "@/features/public-api/services/dispatch-outbound-webhook";
import { recordWorkEvent } from "@/features/work-event";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { db } from "@/shared/db/client";

export async function resolveHandoffAction(input: {
  handoffId: string;
  decision: "accepted" | "rejected";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    const [handoff] = await db
      .select()
      .from(employeeHandoff)
      .where(eq(employeeHandoff.id, input.handoffId))
      .limit(1);

    if (!handoff) {
      return { ok: false, message: "Handoff not found." };
    }

    const [toEmployee] = await db
      .select({
        id: digitalEmployee.id,
        organizationId: digitalEmployee.organizationId,
        name: digitalEmployee.name,
      })
      .from(digitalEmployee)
      .where(eq(digitalEmployee.id, handoff.toEmployeeId))
      .limit(1);

    if (!toEmployee || toEmployee.organizationId !== workspace.organization.id) {
      return { ok: false, message: "Handoff not found." };
    }

    if (handoff.status !== "pending") {
      return { ok: false, message: "Handoff is no longer pending." };
    }

    if (input.decision === "accepted") {
      await db
        .update(employeeHandoff)
        .set({ status: "accepted" })
        .where(eq(employeeHandoff.id, handoff.id));

      if (handoff.taskId) {
        await enqueueEmployeeTask({
          taskId: handoff.taskId,
          organizationId: workspace.organization.id,
        });
      }

      await recordWorkEvent({
        organizationId: workspace.organization.id,
        employeeId: handoff.toEmployeeId,
        taskId: handoff.taskId ?? undefined,
        eventType: "task_received",
        title: `Handoff accepted · ${toEmployee.name}`,
        summary:
          typeof handoff.context?.reason === "string"
            ? handoff.context.reason
            : undefined,
        metadata: { handoffId: handoff.id, decision: "accepted" },
      });

      void dispatchOrganizationWebhook({
        organizationId: workspace.organization.id,
        event: "handoff.accepted",
        data: {
          handoffId: handoff.id,
          fromEmployeeId: handoff.fromEmployeeId,
          toEmployeeId: handoff.toEmployeeId,
          taskId: handoff.taskId,
        },
      });

      return { ok: true };
    }

    await db
      .update(employeeHandoff)
      .set({ status: "cancelled", completedAt: new Date() })
      .where(eq(employeeHandoff.id, handoff.id));

    if (handoff.taskId) {
      await db
        .update(employeeTask)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(employeeTask.id, handoff.taskId),
            eq(employeeTask.status, "pending"),
          ),
        );
    }

    await recordWorkEvent({
      organizationId: workspace.organization.id,
      employeeId: handoff.toEmployeeId,
      taskId: handoff.taskId ?? undefined,
      eventType: "approval_resolved",
      title: "Handoff rejected",
      summary:
        typeof handoff.context?.reason === "string"
          ? handoff.context.reason
          : undefined,
      metadata: { handoffId: handoff.id, decision: "rejected" },
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Handoff update failed.",
    };
  }
}
