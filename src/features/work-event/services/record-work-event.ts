import { employeeWorkEvent } from "@/entities/work-event/schema";
import type { EmployeeWorkEventType } from "@/entities/work-event";
import { db } from "@/shared/db/client";

export async function recordWorkEvent(input: {
  organizationId: string;
  employeeId: string;
  eventType: EmployeeWorkEventType;
  title: string;
  summary?: string;
  taskId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const [event] = await db
    .insert(employeeWorkEvent)
    .values({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      eventType: input.eventType,
      title: input.title,
      summary: input.summary,
      taskId: input.taskId,
      sessionId: input.sessionId,
      metadata: input.metadata,
    })
    .returning({ id: employeeWorkEvent.id });

  if (!event) {
    throw new Error("Failed to record work event");
  }

  return event.id;
}
