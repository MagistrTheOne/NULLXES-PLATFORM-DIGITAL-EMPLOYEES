import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { recordLifecycleEvent } from "../services/record-lifecycle-event";
import type {
  ArchiveDigitalEmployeeInput,
  EmployeeStatusChangeResult,
} from "../types";

function assertCanArchive(status: EmployeeStatus): void {
  if (status === "archived") {
    throw new Error("Digital employee is already archived");
  }
}

export async function archiveDigitalEmployee(
  input: ArchiveDigitalEmployeeInput,
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

    assertCanArchive(existing.status);

    const previousStatus = existing.status;
    const nextStatus: EmployeeStatus = "archived";

    const [employee] = await tx
      .update(digitalEmployee)
      .set({ status: nextStatus })
      .where(eq(digitalEmployee.id, input.employeeId))
      .returning();

    if (!employee) {
      throw new Error("Failed to archive digital employee");
    }

    const lifecycleEvent = await recordLifecycleEvent(tx, {
      employeeId: employee.id,
      actorUserId: input.actorUserId,
      eventType: "archived",
      reason: input.reason ?? "Digital employee archived",
      metadata: { previousStatus, nextStatus },
    });

    return { employee, lifecycleEvent, previousStatus, nextStatus };
  });
}
