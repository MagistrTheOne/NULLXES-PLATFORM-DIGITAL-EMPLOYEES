import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { forbidCatalogMutation } from "@/features/employees/services/platform-employee-catalog";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { recordLifecycleEvent } from "../services/record-lifecycle-event";
import type {
  EmployeeStatusChangeResult,
  PauseDigitalEmployeeInput,
} from "../types";

function assertCanPause(status: EmployeeStatus): void {
  if (status === "archived") {
    throw new Error("Cannot pause an archived digital employee");
  }
  if (status === "paused") {
    throw new Error("Digital employee is already paused");
  }
}

export async function pauseDigitalEmployee(
  input: PauseDigitalEmployeeInput,
): Promise<EmployeeStatusChangeResult> {
  await forbidCatalogMutation(input.employeeId);

  return dbWithTransactions.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(digitalEmployee)
      .where(eq(digitalEmployee.id, input.employeeId))
      .limit(1);

    if (!existing) {
      throw new Error("Digital employee not found");
    }

    assertCanPause(existing.status);

    const previousStatus = existing.status;
    const nextStatus: EmployeeStatus = "paused";

    const [employee] = await tx
      .update(digitalEmployee)
      .set({ status: nextStatus })
      .where(eq(digitalEmployee.id, input.employeeId))
      .returning();

    if (!employee) {
      throw new Error("Failed to pause digital employee");
    }

    const lifecycleEvent = await recordLifecycleEvent(tx, {
      employeeId: employee.id,
      actorUserId: input.actorUserId,
      eventType: "paused",
      reason: input.reason ?? "Digital employee paused",
      metadata: { previousStatus, nextStatus },
    });

    return { employee, lifecycleEvent, previousStatus, nextStatus };
  });
}
