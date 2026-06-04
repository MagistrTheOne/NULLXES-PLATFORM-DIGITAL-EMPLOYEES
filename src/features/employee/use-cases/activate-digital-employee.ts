import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { recordLifecycleEvent } from "../services/record-lifecycle-event";
import type {
  ActivateDigitalEmployeeInput,
  EmployeeStatusChangeResult,
} from "../types";

function assertCanActivate(status: EmployeeStatus): void {
  if (status === "archived") {
    throw new Error("Cannot activate an archived digital employee");
  }
  if (status === "active") {
    throw new Error("Digital employee is already active");
  }
}

export async function activateDigitalEmployee(
  input: ActivateDigitalEmployeeInput,
): Promise<EmployeeStatusChangeResult> {
  return dbWithTransactions.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(digitalEmployee)
      .where(eq(digitalEmployee.id, input.employeeId))
      .limit(1);

    if (!existing) {
      throw new Error("Digital employee not found");
    }

    assertCanActivate(existing.status);

    const previousStatus = existing.status;
    const nextStatus: EmployeeStatus = "active";

    const [employee] = await tx
      .update(digitalEmployee)
      .set({ status: nextStatus })
      .where(eq(digitalEmployee.id, input.employeeId))
      .returning();

    if (!employee) {
      throw new Error("Failed to activate digital employee");
    }

    const lifecycleEvent = await recordLifecycleEvent(tx, {
      employeeId: employee.id,
      actorUserId: input.actorUserId,
      eventType: "activated",
      reason: input.reason ?? "Digital employee activated",
      metadata: { previousStatus, nextStatus },
    });

    return { employee, lifecycleEvent, previousStatus, nextStatus };
  });
}
