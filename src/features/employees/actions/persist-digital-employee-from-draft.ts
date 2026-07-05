"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type {
  AvatarProvider,
  BrainProvider,
} from "@/entities/digital-employee";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { employeeLifecycleEvent } from "@/entities/employee-lifecycle/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { employeeRuntime } from "@/entities/runtime/schema";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { buildEmployeeSystemPrompt } from "@/features/employees/lib/build-system-prompt";
import { recordLifecycleEvent } from "@/features/employee/services/record-lifecycle-event";
import { resolveOrganizationBrainModel } from "@/features/settings/services/resolve-organization-brain-model";
import { enqueueEmployeeProvisioning } from "@/features/provider-provisioning/orchestrator/enqueue-employee-provisioning";
import { persistKnowledgeDraftItems } from "@/features/knowledge-processing/services/persist-knowledge-draft-items";
import { inngest } from "@/inngest/client";
import { db } from "@/shared/db/client";
import { dbWithTransactions } from "@/shared/db/pool-client";
import type { CreateEmployeeDraftPayload } from "../create/types";

export type PersistDigitalEmployeeResult = {
  employeeId: string;
};

export async function persistDigitalEmployeeFromDraft(
  draft: CreateEmployeeDraftPayload,
): Promise<PersistDigitalEmployeeResult> {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canManageEmployees",
  );

  const avatarProvider = draft.avatar.provider as AvatarProvider;
  const brainProvider = draft.brain.provider;
  const brainModel = await resolveOrganizationBrainModel(
    workspace.organization.id,
    brainProvider,
  );
  const studioProvisionedAt = new Date().toISOString();

  const employeeId = await dbWithTransactions.transaction(async (tx) => {
    const [employee] = await tx
      .insert(digitalEmployee)
      .values({
        organizationId: workspace.organization.id,
        name: draft.identity.name,
        role: draft.identity.role,
        description: `${draft.identity.role} digital employee`,
        status: "draft",
        avatarProvider,
        brainProvider,
      })
      .returning();

    if (!employee) {
      throw new Error("Failed to create digital employee");
    }

    const systemPrompt = buildEmployeeSystemPrompt(
      draft.identity.name,
      draft.identity.role,
    );

    const [runtime] = await tx
      .insert(employeeRuntime)
      .values({
        employeeId: employee.id,
        brainProvider,
        avatarProvider,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 4096,
        sessionLimitSeconds: 3600,
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
      reason: "Created from dashboard",
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
          avatarId: draft.avatar.avatarId,
          personaId: draft.avatar.personaId,
          previewUrl: draft.avatar.previewUrl,
          photoFileName: draft.avatar.photoFileName,
          photoFileSize: draft.avatar.photoFileSize,
          displayName: draft.identity.name,
          provisioningStatus: "ready",
          providerMetadata: {
            source: "studio",
            provisionedAt: studioProvisionedAt,
            voiceBinding: draft.avatar.voiceBinding,
            anamPersonaVoiceId: draft.avatar.anamPersonaVoiceId,
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
        providerId: draft.voice.provider,
        config: {
          voiceProvider: draft.voice.provider,
          voiceId: draft.voice.voiceId,
          modelId: draft.voice.model ?? undefined,
          studioVoiceId: draft.voice.studioVoiceId,
          providerResourceId: draft.voice.voiceId,
          provisioningStatus: "ready",
          providerMetadata: {
            source: "studio",
            provisionedAt: studioProvisionedAt,
            voiceBinding: draft.avatar.voiceBinding,
          },
        },
      },
    ]);

    return employee.id;
  });

  if (draft.knowledge.length > 0) {
    await persistKnowledgeDraftItems(employeeId, draft.knowledge);
  }

  const { applyDefaultEmployeeBlueprint } = await import(
    "@/features/agent-blueprint/services/apply-default-employee-blueprint"
  );
  await applyDefaultEmployeeBlueprint({
    organizationId: workspace.organization.id,
    employeeId,
    role: draft.identity.role,
  });

  enqueueEmployeeProvisioning(employeeId);

  await inngest.send({
    name: "employee/created",
    data: {
      employeeId,
      organizationId: workspace.organization.id,
      name: draft.identity.name,
      role: draft.identity.role,
    },
  });

  revalidatePath("/dashboard/employees");

  return { employeeId };
}

export async function assertEmployeePersisted(
  employeeId: string,
): Promise<void> {
  const [lifecycle] = await db
    .select()
    .from(employeeLifecycleEvent)
    .where(eq(employeeLifecycleEvent.employeeId, employeeId))
    .limit(1);

  if (!lifecycle || lifecycle.eventType !== "created") {
    throw new Error("Lifecycle event was not created");
  }

  const configs = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.employeeId, employeeId));

  const types = new Set(configs.map((row) => row.providerType));
  if (!types.has("avatar") || !types.has("brain") || !types.has("session")) {
    throw new Error("Provider configuration was not fully persisted");
  }
}
