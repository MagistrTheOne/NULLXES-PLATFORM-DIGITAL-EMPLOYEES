import { and, asc, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import type { ProvisionEmployeeProvidersResult } from "@/features/provider-provisioning/types";
import { db } from "@/shared/db/client";
import { logServerEvent } from "@/shared/lib/server-log";
import { activateDigitalEmployee } from "../use-cases/activate-digital-employee";

function isProvisioningComplete(
  result: ProvisionEmployeeProvidersResult,
): boolean {
  return (
    result.avatar.status === "ready" &&
    result.brain.status === "ready" &&
    result.voice.status === "ready"
  );
}

export async function activateEmployeeAfterProvisioning(
  employeeId: string,
  provisioning: ProvisionEmployeeProvidersResult,
): Promise<void> {
  if (!isProvisioningComplete(provisioning)) {
    return;
  }

  const [employee] = await db
    .select({
      id: digitalEmployee.id,
      status: digitalEmployee.status,
      organizationId: digitalEmployee.organizationId,
    })
    .from(digitalEmployee)
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!employee || employee.status !== "draft") {
    return;
  }

  const [createdEvent] = await db
    .select({ actorUserId: employeeLifecycleEvent.actorUserId })
    .from(employeeLifecycleEvent)
    .where(
      and(
        eq(employeeLifecycleEvent.employeeId, employeeId),
        eq(employeeLifecycleEvent.eventType, "created"),
      ),
    )
    .orderBy(asc(employeeLifecycleEvent.createdAt))
    .limit(1);

  if (!createdEvent) {
    logServerEvent(
      "employee.activate_after_provisioning.skipped",
      { employeeId, reason: "missing_created_lifecycle_event" },
      "warn",
    );
    return;
  }

  try {
    await activateDigitalEmployee({
      employeeId,
      actorUserId: createdEvent.actorUserId,
      organizationId: employee.organizationId,
      reason: "Auto-activated after provider provisioning completed",
    });

    logServerEvent("employee.activate_after_provisioning.ok", { employeeId });
  } catch (error: unknown) {
    logServerEvent(
      "employee.activate_after_provisioning.failed",
      {
        employeeId,
        message: error instanceof Error ? error.message : "unknown",
      },
      "warn",
    );
  }
}
