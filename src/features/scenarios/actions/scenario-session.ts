"use server";

import type { BillingPlanId } from "@/features/billing/config/plans";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { recordWorkEvent } from "@/features/work-event";
import { logServerEvent } from "@/shared/lib/server-log";
import { assertCanStartScenario } from "../lib/scenario-free-limits";
import { getScenarioTemplateById } from "../lib/scenario-templates";
import {
  generateScenarioDebrief,
  markScenarioDebriefViewed,
  recordScenarioUpgradeClick,
} from "../services/generate-scenario-debrief";
import { createScenarioSession } from "../services/scenario-session";

export type StartScenarioSessionResult =
  | { ok: true; scenarioSessionId: string }
  | { ok: false; message: string };

export async function startScenarioSessionAction(input: {
  employeeId: string;
  templateId: string;
}): Promise<StartScenarioSessionResult> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );
    const billingPlan = workspace.organization.billingPlan as BillingPlanId;

    const limitCheck = await assertCanStartScenario({
      organizationId: workspace.organization.id,
      userId: workspace.user.id,
      billingPlan,
    });

    if (!limitCheck.ok) {
      return { ok: false, message: limitCheck.message };
    }

    const template = getScenarioTemplateById(input.templateId);
    if (!template) {
      return { ok: false, message: "Scenario template not found" };
    }

    const scenarioSessionId = await createScenarioSession({
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      userId: workspace.user.id,
      templateId: input.templateId,
    });

    logServerEvent("scenario.started", {
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      scenarioSessionId,
      templateId: input.templateId,
    });

    await recordWorkEvent({
      organizationId: workspace.organization.id,
      employeeId: input.employeeId,
      eventType: "task_received",
      title: "Scenario started",
      summary: template.id,
      metadata: {
        scenario: true,
        event: "scenario_started",
        scenarioSessionId,
        templateId: input.templateId,
      },
    });

    return { ok: true, scenarioSessionId };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to start scenario",
    };
  }
}

export async function finalizeScenarioDebriefAction(
  scenarioSessionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    await generateScenarioDebrief({
      scenarioSessionId,
      organizationId: workspace.organization.id,
      userId: workspace.user.id,
    });

    logServerEvent("scenario.completed", {
      organizationId: workspace.organization.id,
      scenarioSessionId,
    });

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Debrief generation failed",
    };
  }
}

export async function markScenarioDebriefViewedAction(
  scenarioSessionId: string,
): Promise<void> {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canOperateEmployees",
  );

  await markScenarioDebriefViewed({
    scenarioSessionId,
    organizationId: workspace.organization.id,
    userId: workspace.user.id,
  });

  logServerEvent("scenario.debrief_viewed", {
    organizationId: workspace.organization.id,
    scenarioSessionId,
  });
}

export async function recordScenarioUpgradeClickAction(
  scenarioSessionId: string,
): Promise<void> {
  const workspace = await requireWorkspacePermissionOrThrowMessage(
    "canOperateEmployees",
  );

  await recordScenarioUpgradeClick({
    scenarioSessionId,
    organizationId: workspace.organization.id,
    userId: workspace.user.id,
  });

  logServerEvent("scenario.upgrade_click", {
    organizationId: workspace.organization.id,
    scenarioSessionId,
  });
}
