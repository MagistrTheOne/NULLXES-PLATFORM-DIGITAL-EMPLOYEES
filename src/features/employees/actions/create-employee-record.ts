"use server";

import { revalidatePath } from "next/cache";
import type { AvatarProvider } from "@/entities/digital-employee";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import {
  assertCanCreateEmployee,
  getSessionLimitSecondsForPlan,
} from "@/features/billing/services/check-plan-limits";
import { assertAvatarStudioSelection } from "@/features/billing/services/assert-avatar-studio-selection";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { buildEmployeeSystemPrompt } from "@/features/employees/lib/build-system-prompt";
import { recordLifecycleEvent } from "@/features/employee/services/record-lifecycle-event";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { getOrganizationBrainDefaults } from "@/features/brain/services/get-organization-brain-defaults";
import { resolveBrainModelForProvider } from "@/features/settings/lib/brain-model-defaults";
import { persistKnowledgeDraftItems } from "@/features/knowledge-processing/services/persist-knowledge-draft-items";
import type { CreateEmployeeWizardInput } from "@/features/employees/create/wizard-intake";
import { dbWithTransactions } from "@/shared/db/pool-client";

export type CreateEmployeeRecordResult =
  | { ok: true; employeeId: string }
  | { ok: false; message: string };

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

    const avatarSelection = assertAvatarStudioSelection(billingPlan, {
      presetAvatarId: input.presetAvatarId ?? "",
      hasPhotoFile: input.hasPhotoFile ?? false,
    });

    if (!avatarSelection.ok) {
      return { ok: false, message: avatarSelection.message };
    }

    const sessionLimitSeconds = getSessionLimitSecondsForPlan(billingPlan);
    const avatarProvider: AvatarProvider = "anam";

    const orgBrainDefaults = await getOrganizationBrainDefaults(
      workspace.organization.id,
    );

    const brainProvider =
      input.brainMode === "org_default"
        ? orgBrainDefaults.defaultBrainProvider
        : input.brainProvider;

    if (!brainProvider) {
      return { ok: false, message: "Brain provider is required." };
    }

    const brainModel =
      input.brainMode === "org_default"
        ? orgBrainDefaults.defaultBrainModel
        : resolveBrainModelForProvider(brainProvider, input.brainModel);

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
          brainProvider,
        })
        .returning();

      if (!employee) {
        throw new Error("Failed to create digital employee");
      }

      const [runtime] = await tx
        .insert(employeeRuntime)
        .values({
          employeeId: employee.id,
          brainProvider,
          avatarProvider,
          systemPrompt: buildEmployeeSystemPrompt(name, role),
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
          providerId: brainProvider,
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

      return employee.id;
    });

    if (input.knowledge.length > 0) {
      await persistKnowledgeDraftItems(
        employeeId,
        input.knowledge,
        workspace.organization.id,
      );
    }

    const { applyDefaultEmployeeBlueprint } = await import(
      "@/features/agent-blueprint/services/apply-default-employee-blueprint"
    );
    const { upsertEmployeeCharacter } = await import(
      "@/features/agent-blueprint/services/upsert-employee-character"
    );

    if (input.characterPresetId) {
      await upsertEmployeeCharacter({
        organizationId: workspace.organization.id,
        employeeId,
        presetId: input.characterPresetId,
      });
    } else {
      await applyDefaultEmployeeBlueprint({
        organizationId: workspace.organization.id,
        employeeId,
        role,
      });
    }

    const { provisionXaiVoiceForEmployee } = await import(
      "@/features/xai-voice/services/provision-xai-voice-for-employee"
    );
    await provisionXaiVoiceForEmployee({
      employeeId,
      organizationId: workspace.organization.id,
      name,
      role,
      systemPrompt: buildEmployeeSystemPrompt(name, role),
      enabled: true,
      bindConsoleAgent: false,
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
