import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { recordLifecycleEvent } from "../services/record-lifecycle-event";
import type {
  CreateDigitalEmployeeInput,
  CreateDigitalEmployeeResult,
} from "../types";

export async function createDigitalEmployee(
  input: CreateDigitalEmployeeInput,
): Promise<CreateDigitalEmployeeResult> {
  return dbWithTransactions.transaction(async (tx) => {
    const [employee] = await tx
      .insert(digitalEmployee)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        role: input.role,
        status: "draft",
        avatarProvider: input.avatarProvider,
        brainProvider: input.brainProvider,
      })
      .returning();

    if (!employee) {
      throw new Error("Failed to create digital employee");
    }

    const [runtime] = await tx
      .insert(employeeRuntime)
      .values({
        employeeId: employee.id,
        brainProvider: input.brainProvider,
        avatarProvider: input.avatarProvider,
        systemPrompt: input.systemPrompt,
        temperature: input.temperature ?? 0.7,
        maxTokens: input.maxTokens ?? 4096,
        sessionLimitSeconds: input.sessionLimitSeconds ?? 3600,
        isActive: true,
      })
      .returning();

    if (!runtime) {
      throw new Error("Failed to create employee runtime");
    }

    const lifecycleEvent = await recordLifecycleEvent(tx, {
      employeeId: employee.id,
      actorUserId: input.actorUserId,
      eventType: "created",
      reason: input.reason ?? "Digital employee created",
      metadata: {
        status: employee.status,
        avatarProvider: employee.avatarProvider,
        brainProvider: employee.brainProvider,
      },
    });

    return { employee, runtime, lifecycleEvent };
  });
}
