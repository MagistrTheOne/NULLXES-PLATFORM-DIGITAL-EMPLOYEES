"use server";

import type { BrainProvider } from "@/entities/digital-employee";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import type { EmployeeStatus } from "@/entities/digital-employee";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { enqueueEmployeeProvisioning } from "@/features/provider-provisioning/orchestrator/enqueue-employee-provisioning";
import { assertNotPlatformCatalogEmployee } from "../services/platform-employee-catalog";
import { updateEmployee } from "../services/update-employee";
import { revalidateEmployeePaths } from "./revalidate-employee-paths";

export type UpdateEmployeeActionInput = {
  employeeId: string;
  name: string;
  role: string;
  description: string;
  status: EmployeeStatus;
  systemPrompt: string;
  brainProvider: BrainProvider;
  brainModel: string;
  xaiVoiceEnabled?: boolean;
  xaiVoiceInstructions?: string;
  xaiVoiceBindConsoleAgent?: boolean;
  xaiVoiceAgentId?: string | null;
};

export type UpdateEmployeeActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateEmployeeAction(
  input: UpdateEmployeeActionInput,
): Promise<UpdateEmployeeActionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageEmployees",
    );

    if (
      !planAllowsCreateEmployees(
        resolveBillingPlanId(workspace.organization.billingPlan),
      )
    ) {
      return {
        ok: false,
        message:
          "Evaluation workspaces cannot edit digital employees. Upgrade to Studio, Team, or Scale.",
      };
    }

    const catalogGuard = await assertNotPlatformCatalogEmployee(
      input.employeeId,
      workspace.organization.id,
    );
    if (!catalogGuard.ok) {
      return catalogGuard;
    }

    const result = await updateEmployee({
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      actorUserId: workspace.user.id,
      name: input.name,
      role: input.role,
      description: input.description.trim() || null,
      status: input.status,
      systemPrompt: input.systemPrompt,
      brainProvider: input.brainProvider,
      brainModel: input.brainModel,
      xaiVoiceEnabled: input.xaiVoiceEnabled,
      xaiVoiceInstructions: input.xaiVoiceInstructions,
      xaiVoiceBindConsoleAgent: input.xaiVoiceBindConsoleAgent,
      xaiVoiceAgentId: input.xaiVoiceAgentId,
    });

    if (result.ok) {
      if (result.reprovisionProviders) {
        enqueueEmployeeProvisioning(input.employeeId);
      }

      await revalidateEmployeePaths(input.employeeId);
    }

    return result.ok ? { ok: true } : result;
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
