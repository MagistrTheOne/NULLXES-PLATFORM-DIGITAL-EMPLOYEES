"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { db } from "@/shared/db/client";

import { parseMissionSkills } from "../lib/parse-mission-skills";

const EDITABLE_STATUSES = new Set(["planned", "failed", "cancelled"]);

export async function updateMissionAction(input: {
  missionId: string;
  employeeId: string;
  type: "prospecting" | "custom";
  title: string;
  goal?: string;
  skills?: string;
  brief: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    const missionId = input.missionId.trim();
    const title = input.title.trim();
    const brief = input.brief.trim();
    const goal = input.goal?.trim() || null;
    const skills = parseMissionSkills(input.skills);

    if (!missionId || !title || !brief) {
      return { ok: false, message: "Title and brief are required." };
    }

    const [mission] = await db
      .select({
        id: employeeMission.id,
        status: employeeMission.status,
      })
      .from(employeeMission)
      .where(
        and(
          eq(employeeMission.id, missionId),
          eq(employeeMission.organizationId, workspace.organization.id),
        ),
      )
      .limit(1);

    if (!mission) {
      return { ok: false, message: "Mission not found." };
    }

    if (!EDITABLE_STATUSES.has(mission.status)) {
      return {
        ok: false,
        message: "Only planned, failed, or cancelled missions can be edited.",
      };
    }

    await db
      .update(employeeMission)
      .set({
        employeeId: input.employeeId,
        type: input.type,
        title,
        goal,
        skills,
        brief,
        status: mission.status === "failed" ? "planned" : mission.status,
        errorMessage: mission.status === "failed" ? null : undefined,
      })
      .where(eq(employeeMission.id, missionId));

    revalidatePath("/dashboard/missions");
    revalidatePath(`/dashboard/missions/${missionId}`);

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update mission.",
    };
  }
}

export async function deleteMissionAction(input: {
  missionId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canOperateEmployees",
    );

    const missionId = input.missionId.trim();
    if (!missionId) {
      return { ok: false, message: "Mission not found." };
    }

    const [mission] = await db
      .select({
        id: employeeMission.id,
        status: employeeMission.status,
      })
      .from(employeeMission)
      .where(
        and(
          eq(employeeMission.id, missionId),
          eq(employeeMission.organizationId, workspace.organization.id),
        ),
      )
      .limit(1);

    if (!mission) {
      return { ok: false, message: "Mission not found." };
    }

    if (
      mission.status === "working" ||
      mission.status === "waiting_approval"
    ) {
      return {
        ok: false,
        message: "Cannot delete a mission that is currently running.",
      };
    }

    await db
      .delete(employeeMission)
      .where(eq(employeeMission.id, missionId));

    revalidatePath("/dashboard/missions");

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to delete mission.",
    };
  }
}
