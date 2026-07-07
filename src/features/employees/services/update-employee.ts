import { and, eq } from "drizzle-orm";
import type {
  BrainProvider,
  EmployeeStatus,
} from "@/entities/digital-employee";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import type {
  BrainProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import type { EmployeeLifecycleEventType } from "@/entities/employee-lifecycle";
import { employeeRuntime } from "@/entities/runtime/schema";
import { recordLifecycleEvent } from "@/features/employee/services/record-lifecycle-event";
import {
  resolveBrainModelForProvider,
} from "@/features/settings/lib/brain-model-defaults";
import { isBrainProviderSelectable } from "@/features/brain/lib/brain-provider-readiness";
import { getBrainProviderReadinessMap } from "@/features/brain/lib/brain-provider-readiness";
import { dbWithTransactions } from "@/shared/db/pool-client";
import { getEmployeeForOrganization } from "./get-employee-for-organization";
import { getProviderConfigRow } from "@/features/provider-provisioning/services/update-provider-config";
import { provisionXaiVoiceForEmployee } from "@/features/xai-voice/services/provision-xai-voice-for-employee";
import { isXaiVoiceConfigured } from "@/shared/config/xai-voice-env";

export type UpdateEmployeeInput = {
  organizationId: string;
  employeeId: string;
  actorUserId: string;
  name: string;
  role: string;
  description: string | null;
  status: EmployeeStatus;
  systemPrompt: string;
  brainProvider: BrainProvider;
  brainModel: string;
  xaiVoiceEnabled?: boolean;
  xaiVoiceInstructions?: string;
  xaiVoiceBindConsoleAgent?: boolean;
  xaiVoiceAgentId?: string | null;
};

export type UpdateEmployeeResult =
  | { ok: true; reprovisionProviders: boolean }
  | { ok: false; message: string };

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
): Promise<UpdateEmployeeResult> {
  const name = input.name.trim();
  const role = input.role.trim();
  const systemPrompt = input.systemPrompt.trim();
  const brainModel = resolveBrainModelForProvider(
    input.brainProvider,
    input.brainModel,
  );

  if (!name || !role) {
    return { ok: false, message: "Name and role are required" };
  }

  if (!systemPrompt) {
    return { ok: false, message: "System prompt is required" };
  }

  if (!brainModel.trim()) {
    return { ok: false, message: "Brain model is required" };
  }

  const readiness = getBrainProviderReadinessMap()[input.brainProvider];
  if (!isBrainProviderSelectable(input.brainProvider, readiness)) {
    return {
      ok: false,
      message: "Selected brain provider is not configured for this workspace.",
    };
  }

  const existing = await getEmployeeForOrganization(
    input.organizationId,
    input.employeeId,
  );

  if (!existing) {
    return { ok: false, message: "Employee not found" };
  }

  const brainRow = await getProviderConfigRow(input.employeeId, "brain");
  const sessionRow = await getProviderConfigRow(input.employeeId, "session");
  const currentBrainConfig = (brainRow?.config ??
    {}) as BrainProviderConfigPayload;
  const currentBrainModel = currentBrainConfig.model ?? "";
  const brainChanged =
    existing.brainProvider !== input.brainProvider ||
    currentBrainModel !== brainModel;

  const currentSessionConfig = (sessionRow?.config ??
    {}) as SessionProviderConfigPayload;
  const voiceFieldsProvided =
    input.xaiVoiceEnabled !== undefined ||
    input.xaiVoiceInstructions !== undefined ||
    input.xaiVoiceBindConsoleAgent !== undefined ||
    input.xaiVoiceAgentId !== undefined;

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
          brainProvider: input.brainProvider,
        })
        .where(eq(digitalEmployee.id, input.employeeId));

      if (runtime) {
        await tx
          .update(employeeRuntime)
          .set({
            systemPrompt,
            brainProvider: input.brainProvider,
          })
          .where(eq(employeeRuntime.employeeId, input.employeeId));
      }

      if (brainRow && brainChanged) {
        const nextBrainConfig: Record<string, unknown> = {
          ...currentBrainConfig,
          model: brainModel,
          provisioningStatus: "pending",
          failureReason: undefined,
        };

        delete nextBrainConfig.providerResourceId;

        await tx
          .update(employeeProviderConfig)
          .set({
            providerId: input.brainProvider,
            config: nextBrainConfig,
          })
          .where(
            and(
              eq(employeeProviderConfig.employeeId, input.employeeId),
              eq(employeeProviderConfig.providerType, "brain"),
            ),
          );
      }

      if (sessionRow && voiceFieldsProvided && isXaiVoiceConfigured()) {
        const bindConsoleAgent =
          input.xaiVoiceBindConsoleAgent ??
          currentSessionConfig.xaiVoiceBindConsoleAgent ??
          false;
        const enabled =
          input.xaiVoiceEnabled ?? currentSessionConfig.xaiVoiceEnabled ?? false;

        const nextSessionConfig: SessionProviderConfigPayload = {
          ...currentSessionConfig,
          xaiVoiceEnabled: enabled,
          xaiVoiceBindConsoleAgent: bindConsoleAgent,
        };

        if (input.xaiVoiceInstructions !== undefined) {
          nextSessionConfig.xaiVoiceInstructions =
            input.xaiVoiceInstructions.trim() || undefined;
        }

        if (input.xaiVoiceAgentId !== undefined) {
          nextSessionConfig.xaiVoiceAgentId =
            input.xaiVoiceAgentId?.trim() || undefined;
        }

        await tx
          .update(employeeProviderConfig)
          .set({ config: nextSessionConfig })
          .where(
            and(
              eq(employeeProviderConfig.employeeId, input.employeeId),
              eq(employeeProviderConfig.providerType, "session"),
            ),
          );
      }

      const statusEvent = lifecycleEventForStatusChange(
        existing.status,
        input.status,
      );

      const profileChanged =
        existing.name !== name ||
        existing.role !== role ||
        (existing.description ?? "") !== (input.description ?? "") ||
        (runtime?.systemPrompt ?? "") !== systemPrompt ||
        brainChanged;

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
          reason: brainChanged
            ? "Employee profile and brain model updated"
            : "Employee profile updated",
          metadata: brainChanged
            ? {
                brainProvider: input.brainProvider,
                brainModel,
              }
            : undefined,
        });
      }
    });

    if (
      isXaiVoiceConfigured() &&
      (input.xaiVoiceEnabled === true ||
        (voiceFieldsProvided &&
          (input.xaiVoiceEnabled ??
            currentSessionConfig.xaiVoiceEnabled ??
            false)))
    ) {
      await provisionXaiVoiceForEmployee({
        employeeId: input.employeeId,
        organizationId: input.organizationId,
        name,
        role,
        systemPrompt,
        enabled:
          input.xaiVoiceEnabled ?? currentSessionConfig.xaiVoiceEnabled ?? true,
        voiceInstructions:
          input.xaiVoiceInstructions ??
          currentSessionConfig.xaiVoiceInstructions ??
          null,
        bindConsoleAgent:
          input.xaiVoiceBindConsoleAgent ??
          currentSessionConfig.xaiVoiceBindConsoleAgent ??
          false,
        consoleAgentId:
          input.xaiVoiceAgentId ??
          currentSessionConfig.xaiVoiceAgentId ??
          null,
      });
    }

    return { ok: true, reprovisionProviders: brainChanged };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update employee";
    return { ok: false, message };
  }
}
