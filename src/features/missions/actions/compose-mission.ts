"use server";

import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import {
  composeMissionFromIntent,
  type ComposedMissionDraft,
  type MissionComposeEmployee,
  type MissionComposeSkill,
} from "../services/compose-mission-from-intent";

export async function composeMissionAction(input: {
  intent: string;
  preferredEmployeeId?: string;
  employees: MissionComposeEmployee[];
  skillLibrary: MissionComposeSkill[];
}): Promise<
  { ok: true; draft: ComposedMissionDraft } | { ok: false; message: string }
> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    if (
      !planAllowsCreateEmployees(
        resolveBillingPlanId(workspace.organization.billingPlan),
      )
    ) {
      return {
        ok: false,
        message:
          "Tasks are unavailable on Evaluation. Upgrade to Studio, Team, or Scale.",
      };
    }

    const draft = await composeMissionFromIntent({
      intent: input.intent,
      employees: input.employees,
      skillLibrary: input.skillLibrary,
      preferredEmployeeId: input.preferredEmployeeId,
    });

    return { ok: true, draft };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Failed to compose task.",
    };
  }
}
