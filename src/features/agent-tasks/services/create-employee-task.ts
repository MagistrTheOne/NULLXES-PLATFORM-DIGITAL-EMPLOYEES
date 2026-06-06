import { employeeTask } from "@/entities/task/schema";
import type { EmployeeTaskSource } from "@/entities/task";
import { db } from "@/shared/db/client";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";

export async function createEmployeeTask(input: {
  organizationId: string;
  employeeId: string;
  title: string;
  description: string;
  source: EmployeeTaskSource;
  sessionId?: string;
  dueAt?: Date;
  callbackUrl?: string;
}): Promise<string> {
  const [task] = await db
    .insert(employeeTask)
    .values({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      title: input.title,
      description: input.description,
      source: input.source,
      sessionId: input.sessionId,
      dueAt: input.dueAt,
      callbackUrl: input.callbackUrl,
    })
    .returning({ id: employeeTask.id });

  if (!task) {
    throw new Error("Failed to create employee task");
  }

  return task.id;
}

export async function enqueueEmployeeTask(input: {
  taskId: string;
  organizationId: string;
  dueAt?: Date;
}): Promise<void> {
  if (!isInngestEnabledForSend()) {
    return;
  }

  if (input.dueAt && input.dueAt.getTime() > Date.now()) {
    await inngest.send({
      name: "employee/followup.due",
      data: {
        taskId: input.taskId,
        organizationId: input.organizationId,
      },
      ts: input.dueAt.getTime(),
    });
    return;
  }

  await inngest.send({
    name: "employee/task.received",
    data: {
      taskId: input.taskId,
      organizationId: input.organizationId,
    },
  });
}
