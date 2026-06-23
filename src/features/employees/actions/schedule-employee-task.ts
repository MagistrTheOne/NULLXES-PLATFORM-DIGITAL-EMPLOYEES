"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import {
  createEmployeeTask,
  enqueueEmployeeTask,
} from "@/features/agent-tasks";
import { recordWorkEvent } from "@/features/work-event";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { db } from "@/shared/db/client";

export type ScheduleEmployeeTaskResult =
  | { ok: true; taskId: string }
  | { ok: false; message: string };

export async function scheduleEmployeeTaskAction(input: {
  employeeId: string;
  title: string;
  description: string;
  dueAt: string;
}): Promise<ScheduleEmployeeTaskResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    const employeeId = input.employeeId.trim();
    const title = input.title.trim();
    const description = input.description.trim();
    const dueAt = new Date(input.dueAt);

    if (!employeeId || !title || !description || Number.isNaN(dueAt.getTime())) {
      return { ok: false, message: "Title, description, and due date are required." };
    }

    const [employee] = await db
      .select({ id: digitalEmployee.id })
      .from(digitalEmployee)
      .where(
        and(
          eq(digitalEmployee.id, employeeId),
          eq(digitalEmployee.organizationId, workspace.organization.id),
        ),
      )
      .limit(1);

    if (!employee) {
      return { ok: false, message: "Employee not found." };
    }

    const taskId = await createEmployeeTask({
      organizationId: workspace.organization.id,
      employeeId,
      title,
      description,
      source: "followup",
      dueAt,
    });

    await enqueueEmployeeTask({
      taskId,
      organizationId: workspace.organization.id,
      dueAt,
    });

    await recordWorkEvent({
      organizationId: workspace.organization.id,
      employeeId,
      taskId,
      eventType: "task_received",
      title,
      summary: description,
      metadata: { source: "scheduled_ui", dueAt: dueAt.toISOString() },
    });

    revalidatePath(`/dashboard/employees/${employeeId}`);
    return { ok: true, taskId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to schedule task.",
    };
  }
}
