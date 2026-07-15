"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { recordWorkEvent } from "@/features/work-event";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { parseMissionSkills } from "../lib/parse-mission-skills";
import {
  createEmployeeMission,
  enqueueEmployeeMission,
} from "@/features/missions/services/create-employee-mission";
import {
  defaultMissionBrief,
  defaultMissionTitle,
} from "../lib/prospecting-defaults";
import type { MissionType } from "../lib/mission-type";
import { isQualifiedMissionType } from "../lib/mission-type";
import { assertNotPlatformCatalogEmployee } from "@/features/employees/services/platform-employee-catalog";
import { db } from "@/shared/db/client";

export async function createMissionAction(input: {
  employeeId: string;
  type: MissionType;
  title?: string;
  goal?: string;
  skills?: string;
  skillIds?: string[];
  brief?: string;
}): Promise<{ ok: true; missionId: string } | { ok: false; message: string }> {
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
          "Missions are unavailable on Evaluation. Upgrade to Studio, Team, or Scale.",
      };
    }

    const employeeId = input.employeeId.trim();
    if (!employeeId) {
      return { ok: false, message: "Select a digital employee." };
    }

    const catalogGuard = await assertNotPlatformCatalogEmployee(
      employeeId,
      workspace.organization.id,
    );
    if (!catalogGuard.ok) {
      return {
        ok: false,
        message:
          "Missions cannot run on NULLXES beta catalog employees. Upgrade to create your own workforce.",
      };
    }

    const [employee] = await db
      .select({
        id: digitalEmployee.id,
        name: digitalEmployee.name,
      })
      .from(digitalEmployee)
      .where(
        and(
          eq(digitalEmployee.id, employeeId),
          eq(digitalEmployee.organizationId, workspace.organization.id),
        ),
      )
      .limit(1);

    if (!employee) {
      return { ok: false, message: "Employee not found." };
    }

    const type = input.type;
    const title =
      input.title?.trim() ||
      (isQualifiedMissionType(type)
        ? defaultMissionTitle(employee.name, type)
        : type === "custom"
          ? "Custom mission"
          : "Mission");
    const brief =
      input.brief?.trim() ||
      (isQualifiedMissionType(type) ? defaultMissionBrief(type) : "");

    if (!brief) {
      return { ok: false, message: "Mission brief is required." };
    }

    const goal = input.goal?.trim() || null;
    const skills = parseMissionSkills(input.skills);

    const missionId = await createEmployeeMission({
      organizationId: workspace.organization.id,
      employeeId,
      createdByUserId: workspace.user.id,
      title,
      goal,
      skills,
      skillIds: input.skillIds ?? [],
      brief,
      type,
    });

    await enqueueEmployeeMission({
      missionId,
      organizationId: workspace.organization.id,
    });

    await recordWorkEvent({
      organizationId: workspace.organization.id,
      employeeId,
      eventType: "task_received",
      title,
      summary: brief,
      metadata: { missionId, type, source: "mission_control" },
    });

    revalidatePath("/dashboard/missions");
    revalidatePath(`/dashboard/missions/${missionId}`);

    return { ok: true, missionId };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create mission.",
    };
  }
}
