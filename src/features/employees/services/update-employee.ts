import { eq } from "drizzle-orm";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import type { EmployeeLifecycleEventType } from "@/entities/employee-lifecycle";
import { employeeRuntime } from "@/entities/runtime/schema";
import { recordLifecycleEvent } from "@/features/employee/services/record-lifecycle-event";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { getEmployeeForOrganization } from "./get-employee-for-organization";

export type UpdateEmployeeInput = {
  organizationId: string;
  employeeId: string;
  actorUserId: string;
  name: string;
  role: string;
  description: string | null;
  status: EmployeeStatus;
  systemPrompt: string;
};

function lifecycleEventForStatusChange(
  previousStatus: EmployeeStatus,
  nextStatus: EmployeeStatus,
): EmployeeLifecycleEventType | null {
  if (previousStatus === nextStatus) {
    return null;
  }

  if (nextStatus === "active") {
    return "activated";
  }

  if (nextStatus === "paused") {
    return "paused";
  }

  if (nextStatus === "archived") {
    return "archived";
  }

  return "runtime_updated";
}

export async function updateEmployee(
  input: UpdateEmployeeInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const name = input.name.trim();
  const role = input.role.trim();
  const systemPrompt = input.systemPrompt.trim();

  if (!name || !role) {
    return { ok: false, message: "Name and role are required" };
  }

  if (!systemPrompt) {
    return { ok: false, message: "System prompt is required" };
  }

  const existing = await getEmployeeForOrganization(
    input.organizationId,
    input.employeeId,
  );

  if (!existing) {
    return { ok: false, message: "Employee not found" };
  }

  try {
    await dbWithTransactions.transaction(async (tx) => {
      const [runtime] = await tx
        .select()
        .from(employeeRuntime)
        .where(eq(employeeRuntime.employeeId, input.employeeId))
        .limit(1);

      await tx
        .update(digitalEmployee)
        .set({
          name,
          role,
          description: input.description,
          status: input.status,
        })
        .where(eq(digitalEmployee.id, input.employeeId));

      if (runtime) {
        await tx
          .update(employeeRuntime)
          .set({ systemPrompt })
          .where(eq(employeeRuntime.employeeId, input.employeeId));
      }

      const statusEvent = lifecycleEventForStatusChange(
        existing.status,
        input.status,
      );

      const profileChanged =
        existing.name !== name ||
        existing.role !== role ||
        (existing.description ?? "") !== (input.description ?? "") ||
        (runtime?.systemPrompt ?? "") !== systemPrompt;

      if (statusEvent) {
        await recordLifecycleEvent(tx, {
          employeeId: input.employeeId,
          actorUserId: input.actorUserId,
          eventType: statusEvent,
          reason: "Status updated",
          metadata: {
            previousStatus: existing.status,
            nextStatus: input.status,
          },
        });
      } else if (profileChanged) {
        await recordLifecycleEvent(tx, {
          employeeId: input.employeeId,
          actorUserId: input.actorUserId,
          eventType: "runtime_updated",
          reason: "Employee profile updated",
        });
      }
    });

    return { ok: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update employee";
    return { ok: false, message };
  }
}
