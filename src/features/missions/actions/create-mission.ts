"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { recordWorkEvent } from "@/features/work-event";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import {
  createEmployeeMission,
  defaultProspectingBrief,
  defaultProspectingTitle,
  enqueueEmployeeMission,
} from "@/features/missions/services/create-employee-mission";
import { db } from "@/shared/db/client";

export async function createMissionAction(input: {
  employeeId: string;
  type: "prospecting" | "custom";
  title?: string;
  brief?: string;
}): Promise<{ ok: true; missionId: string } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    const employeeId = input.employeeId.trim();
    if (!employeeId) {
      return { ok: false, message: "Select a digital employee." };
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
      (type === "prospecting"
        ? defaultProspectingTitle(employee.name)
        : "Custom mission");
    const brief =
      input.brief?.trim() ||
      (type === "prospecting" ? defaultProspectingBrief() : "");

    if (!brief) {
      return { ok: false, message: "Mission brief is required." };
    }

    const missionId = await createEmployeeMission({
      organizationId: workspace.organization.id,
      employeeId,
      createdByUserId: workspace.user.id,
      title,
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
