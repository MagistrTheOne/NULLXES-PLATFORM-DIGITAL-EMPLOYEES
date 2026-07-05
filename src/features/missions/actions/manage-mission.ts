"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { employeeMission } from "@/entities/employee-mission";
import { appendMissionTimelineStep } from "@/features/missions/lib/append-mission-timeline-step";
import {
  enqueueEmployeeMission,
} from "@/features/missions/services/create-employee-mission";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { db } from "@/shared/db/client";

import { parseMissionSkills } from "../lib/parse-mission-skills";
import type { MissionType } from "../lib/mission-type";

const EDITABLE_STATUSES = new Set(["planned", "failed", "cancelled"]);

export async function updateMissionAction(input: {
  missionId: string;
  employeeId: string;
  type: MissionType;
  title: string;
  goal?: string;
  skills?: string;
  skillIds?: string[];
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
    const skills =
      input.skills !== undefined
        ? parseMissionSkills(input.skills)
        : undefined;

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
        ...(skills !== undefined ? { skills } : {}),
        ...(input.skillIds !== undefined ? { skillIds: input.skillIds } : {}),
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

export async function cancelMissionAction(input: {
  missionId: string;
  reason?: string;
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
        timeline: employeeMission.timeline,
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
      mission.status === "completed" ||
      mission.status === "cancelled"
    ) {
      return { ok: false, message: "Mission is already finished." };
    }

    const reason = input.reason?.trim() || "Cancelled by operator";

    const pendingApprovals = await db
      .select({
        id: agentApprovalRequest.id,
        payload: agentApprovalRequest.payload,
      })
      .from(agentApprovalRequest)
      .where(
        and(
          eq(agentApprovalRequest.organizationId, workspace.organization.id),
          eq(agentApprovalRequest.status, "pending"),
          eq(agentApprovalRequest.actionType, "mission_proposals"),
        ),
      );

    for (const approval of pendingApprovals) {
      if (approval.payload?.missionId !== missionId) {
        continue;
      }

      await db
        .update(agentApprovalRequest)
        .set({
          status: "rejected",
          resolvedAt: new Date(),
          reviewerUserId: workspace.user.id,
        })
        .where(eq(agentApprovalRequest.id, approval.id));
    }

    await db
      .update(employeeMission)
      .set({
        status: "cancelled",
        errorMessage: null,
        completedAt: new Date(),
        timeline: appendMissionTimelineStep(mission.timeline ?? [], {
          key: "cancelled",
          label: `Mission cancelled · ${reason}`,
        }),
      })
      .where(eq(employeeMission.id, missionId));

    revalidatePath("/dashboard/missions");
    revalidatePath(`/dashboard/missions/${missionId}`);

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to cancel mission.",
    };
  }
}

export async function restartMissionAction(input: {
  missionId: string;
  brief?: string;
  goal?: string;
  skills?: string;
  reason?: string;
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
        employeeId: employeeMission.employeeId,
        status: employeeMission.status,
        brief: employeeMission.brief,
        goal: employeeMission.goal,
        skills: employeeMission.skills,
        timeline: employeeMission.timeline,
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

    if (mission.status === "working") {
      return {
        ok: false,
        message: "Cancel the mission first before restarting with new inputs.",
      };
    }

    if (mission.status === "waiting_approval") {
      const pendingApprovals = await db
        .select({
          id: agentApprovalRequest.id,
          payload: agentApprovalRequest.payload,
        })
        .from(agentApprovalRequest)
        .where(
          and(
            eq(agentApprovalRequest.organizationId, workspace.organization.id),
            eq(agentApprovalRequest.status, "pending"),
            eq(agentApprovalRequest.actionType, "mission_proposals"),
          ),
        );

      for (const approval of pendingApprovals) {
        if (approval.payload?.missionId !== missionId) {
          continue;
        }

        await db
          .update(agentApprovalRequest)
          .set({
            status: "rejected",
            resolvedAt: new Date(),
            reviewerUserId: workspace.user.id,
          })
          .where(eq(agentApprovalRequest.id, approval.id));
      }
    }

    const brief = input.brief?.trim() || mission.brief;
    const goal = input.goal !== undefined ? input.goal.trim() || null : mission.goal;
    const skills =
      input.skills !== undefined
        ? parseMissionSkills(input.skills)
        : mission.skills;
    const reason = input.reason?.trim() || "Restarted with updated inputs";

    await db
      .update(employeeMission)
      .set({
        brief,
        goal,
        skills,
        status: "planned",
        leads: [],
        evidence: [],
        handoffs: [],
        errorMessage: null,
        completedAt: null,
        timeline: appendMissionTimelineStep(mission.timeline ?? [], {
          key: "restarted",
          label: `Mission restarted · ${reason}`,
        }),
      })
      .where(eq(employeeMission.id, missionId));

    await enqueueEmployeeMission({
      missionId,
      organizationId: workspace.organization.id,
    });

    revalidatePath("/dashboard/missions");
    revalidatePath(`/dashboard/missions/${missionId}`);

    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to restart mission.",
    };
  }
}

