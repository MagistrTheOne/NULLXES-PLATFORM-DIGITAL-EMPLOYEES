import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import type { EmployeeLifecycleEventType } from "@/entities/employee-lifecycle";
import { db } from "@/shared/db/client";

type DbClient = typeof db;

export type RecordLifecycleEventInput = {
  employeeId: string;
  actorUserId: string;
  eventType: EmployeeLifecycleEventType;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export async function recordLifecycleEvent(
  client: DbClient,
  input: RecordLifecycleEventInput,
) {
  const [event] = await client
    .insert(employeeLifecycleEvent)
    .values({
      employeeId: input.employeeId,
      actorUserId: input.actorUserId,
      eventType: input.eventType,
      reason: input.reason,
      metadata: input.metadata,
    })
    .returning();

  if (!event) {
    throw new Error("Failed to record lifecycle event");
  }

  return event;
}
