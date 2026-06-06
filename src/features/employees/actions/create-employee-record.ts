"use server";

import { revalidatePath } from "next/cache";
import type { AvatarProvider } from "@/entities/digital-employee";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import {
  assertCanCreateEmployee,
  getSessionLimitSecondsForPlan,
} from "@/features/billing/services/check-plan-limits";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { recordLifecycleEvent } from "@/features/employee/services/record-lifecycle-event";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { resolveOrganizationBrainModel } from "@/features/settings/services/resolve-organization-brain-model";
import type { CreateEmployeeWizardInput } from "@/features/employees/create/wizard-intake";
import { dbWithTransactions } from "@/shared/db/pool-client";

export type CreateEmployeeRecordResult =
  | { ok: true; employeeId: string }
  | { ok: false; message: string };

function buildSystemPrompt(name: string, role: string): string {
  return `You are ${name}, a ${role}. Operate professionally within your organization's digital workforce.`;
}

export async function createEmployeeRecord(
  input: CreateEmployeeWizardInput,
): Promise<CreateEmployeeRecordResult> {
  const name = input.name.trim();
  const role = input.role.trim();

  if (!name || !role) {
    return { ok: false, message: "Employee name and role are required" };
  }

  if (!input.studioVoiceId) {
    return { ok: false, message: "Voice selection is required" };
  }

  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );
    const billingPlan = workspace.organization.billingPlan as BillingPlanId;
    const employeeLimit = await assertCanCreateEmployee(
      workspace.organization.id,
      billingPlan,
    );

    if (!employeeLimit.ok) {
      return { ok: false, message: employeeLimit.message };
    }

    const sessionLimitSeconds = getSessionLimitSecondsForPlan(billingPlan);
    const avatarProvider: AvatarProvider = "anam";
    const brainModel = await resolveOrganizationBrainModel(
      workspace.organization.id,
      input.brainProvider,
    );

    const employeeId = await dbWithTransactions.transaction(async (tx) => {
      const [employee] = await tx
        .insert(digitalEmployee)
        .values({
          organizationId: workspace.organization.id,
          name,
          role,
          description: `${role} digital employee`,
          status: "draft",
          avatarProvider,
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
          avatarProvider,
          systemPrompt: buildSystemPrompt(name, role),
          temperature: 0.7,
          maxTokens: 4096,
          sessionLimitSeconds,
          isActive: true,
        })
        .returning();

      if (!runtime) {
        throw new Error("Failed to create employee runtime");
      }

      await recordLifecycleEvent(tx, {
        employeeId: employee.id,
        actorUserId: workspace.user.id,
        eventType: "created",
        reason: "Created from dashboard wizard",
        metadata: {
          status: employee.status,
          avatarProvider: employee.avatarProvider,
          brainProvider: employee.brainProvider,
        },
      });

      await tx.insert(employeeProviderConfig).values([
        {
          employeeId: employee.id,
          providerType: "avatar",
          providerId: avatarProvider,
          config: {
            photoFileName: input.photoFileName,
            photoFileSize: input.photoFileSize,
            displayName: name,
            provisioningStatus: "pending",
            providerMetadata: {
              source: "studio",
              studioVoiceId: input.studioVoiceId,
              customElevenLabsVoiceId: input.customElevenLabsVoiceId ?? null,
            },
          },
        },
        {
          employeeId: employee.id,
          providerType: "brain",
          providerId: input.brainProvider,
          config: {
            model: brainModel,
            provisioningStatus: "pending",
          },
        },
        {
          employeeId: employee.id,
          providerType: "session",
          providerId: input.voiceProvider,
          config: {
            voiceProvider: input.voiceProvider,
            studioVoiceId: input.studioVoiceId,
            provisioningStatus: "pending",
            providerMetadata: {
              source: "studio",
              customElevenLabsVoiceId: input.customElevenLabsVoiceId ?? null,
            },
          },
        },
      ]);

      if (input.knowledge.length > 0) {
        await tx.insert(knowledgeSource).values(
          input.knowledge.map((item) => ({
            employeeId: employee.id,
            type: item.type,
            title:
              item.type === "file"
                ? item.name
                : item.type === "url"
                  ? item.url
                  : item.content.slice(0, 160),
            status: "pending" as const,
          })),
        );
      }

      return employee.id;
    });

    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      actorRole: workspace.membership.role,
      action: "employee.created",
      resourceType: "digital_employee",
      resourceId: employeeId,
      metadata: { name, role },
    });

    revalidatePath("/dashboard/employees");
    return { ok: true, employeeId };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create digital employee record",
    };
  }
}
