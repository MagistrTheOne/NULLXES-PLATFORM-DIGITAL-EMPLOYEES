"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import { employeeMission } from "@/entities/employee-mission";
import { employeeTask } from "@/entities/task/schema";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { appendMissionTimelineStep } from "@/features/missions/lib/append-mission-timeline-step";
import { executeMissionOutbound } from "@/features/missions/services/execute-mission-outbound";
import { recordWorkEvent } from "@/features/work-event";
import { requireWorkspacePermissionOrThrowMessage } from "@/features/workspace";
import { db } from "@/shared/db/client";

export async function resolveApprovalAction(input: {
  approvalId: string;
  decision: "approved" | "rejected";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const workspace = await requireWorkspacePermissionOrThrowMessage(
      "canManageOrganization",
    );

    const [approval] = await db
      .select()
      .from(agentApprovalRequest)
      .where(
        and(
          eq(agentApprovalRequest.id, input.approvalId),
          eq(agentApprovalRequest.organizationId, workspace.organization.id),
          eq(agentApprovalRequest.status, "pending"),
        ),
      )
      .limit(1);

    if (!approval) {
      return { ok: false, message: "Approval request not found" };
    }

    await db
      .update(agentApprovalRequest)
      .set({
        status: input.decision,
        reviewerUserId: workspace.user.id,
        resolvedAt: new Date(),
      })
      .where(eq(agentApprovalRequest.id, approval.id));

    await recordWorkEvent({
      organizationId: workspace.organization.id,
      employeeId: approval.employeeId,
      taskId: approval.taskId ?? undefined,
      eventType: "approval_resolved",
      title: `Approval ${input.decision}`,
      summary: approval.actionType,
      metadata: { approvalId: approval.id, decision: input.decision },
    });

    if (input.decision === "approved" && approval.taskId) {
      await db
        .update(employeeTask)
        .set({ status: "pending" })
        .where(eq(employeeTask.id, approval.taskId));

      if (isInngestEnabledForSend()) {
        await inngest.send({
          name: "employee/task.received",
          data: {
            taskId: approval.taskId,
            organizationId: workspace.organization.id,
          },
        });
      }
    } else if (input.decision === "rejected" && approval.taskId) {
      await db
        .update(employeeTask)
        .set({ status: "cancelled", completedAt: new Date() })
        .where(eq(employeeTask.id, approval.taskId));
    }

    const missionId =
      typeof approval.payload.missionId === "string"
        ? approval.payload.missionId
        : null;

    if (missionId && approval.actionType === "mission_proposals") {
      if (input.decision === "approved") {
        const [missionRow] = await db
          .select({
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

        await db
          .update(employeeMission)
          .set({
            status: "working",
            timeline: appendMissionTimelineStep(missionRow?.timeline ?? [], {
              key: "outbound_queued",
              label: "Proposal approval received · sending outbound",
            }),
          })
          .where(
            and(
              eq(employeeMission.id, missionId),
              eq(employeeMission.organizationId, workspace.organization.id),
            ),
          );

        if (isInngestEnabledForSend()) {
          await inngest.send({
            name: "employee/mission.outbound.send",
            data: {
              missionId,
              organizationId: workspace.organization.id,
            },
          });
        } else {
          await executeMissionOutbound({
            missionId,
            organizationId: workspace.organization.id,
          });
        }
      } else {
        await db
          .update(employeeMission)
          .set({
            status: "cancelled",
            completedAt: new Date(),
          })
          .where(
            and(
              eq(employeeMission.id, missionId),
              eq(employeeMission.organizationId, workspace.organization.id),
            ),
          );
      }

      revalidatePath("/dashboard/missions");
      revalidatePath(`/dashboard/missions/${missionId}`);
    }

    if (input.decision === "approved" && approval.actionType === "cancel_mission") {
      if (!missionId) {
        return { ok: false, message: "Cancel mission approval is missing missionId." };
      }

      const { cancelMissionAction } = await import(
        "@/features/missions/actions/manage-mission"
      );
      const reason =
        typeof approval.payload.reason === "string"
          ? approval.payload.reason
          : undefined;
      const result = await cancelMissionAction({ missionId, reason });
      if (!result.ok) {
        return result;
      }
    }

    if (input.decision === "approved" && approval.actionType === "restart_mission") {
      if (!missionId) {
        return { ok: false, message: "Restart mission approval is missing missionId." };
      }

      const { restartMissionAction } = await import(
        "@/features/missions/actions/manage-mission"
      );
      const result = await restartMissionAction({
        missionId,
        brief:
          typeof approval.payload.brief === "string"
            ? approval.payload.brief
            : undefined,
        goal:
          typeof approval.payload.goal === "string"
            ? approval.payload.goal
            : undefined,
        skills:
          typeof approval.payload.skills === "string"
            ? approval.payload.skills
            : undefined,
        reason:
          typeof approval.payload.reason === "string"
            ? approval.payload.reason
            : undefined,
      });
      if (!result.ok) {
        return result;
      }
    }

    if (input.decision === "approved" && approval.actionType === "draft_email") {
      const to =
        typeof approval.payload.to === "string" ? approval.payload.to : "";
      const subject =
        typeof approval.payload.subject === "string"
          ? approval.payload.subject
          : "";
      const body =
        typeof approval.payload.body === "string" ? approval.payload.body : "";
      const draft =
        typeof approval.payload.draft === "string"
          ? approval.payload.draft
          : `To: ${to}\nSubject: ${subject}\n\n${body}`;

      await recordWorkEvent({
        organizationId: workspace.organization.id,
        employeeId: approval.employeeId,
        sessionId:
          typeof approval.payload.sessionId === "string"
            ? approval.payload.sessionId
            : undefined,
        eventType: "task_received",
        title: `Approved email draft · ${subject || "untitled"}`,
        summary: to ? `To: ${to} · review only, not sent` : "Review only, not sent",
        metadata: {
          tool: "draft_email",
          approvalId: approval.id,
          to,
          subject,
          body,
          draft,
          sent: false,
        },
      });
    }

    if (
      input.decision === "approved" &&
      approval.actionType === "create_follow_up_task"
    ) {
      const title =
        typeof approval.payload.title === "string"
          ? approval.payload.title.trim()
          : "";
      const description =
        typeof approval.payload.description === "string"
          ? approval.payload.description.trim()
          : "";
      const dueInHours =
        typeof approval.payload.dueInHours === "number" &&
        approval.payload.dueInHours > 0
          ? approval.payload.dueInHours
          : 24;
      if (!title || !description) {
        return { ok: false, message: "Follow-up task approval payload invalid." };
      }
      const { createEmployeeTask, enqueueEmployeeTask } = await import(
        "@/features/agent-tasks"
      );
      const dueAt = new Date(Date.now() + dueInHours * 60 * 60 * 1000);
      const sessionId =
        typeof approval.payload.sessionId === "string"
          ? approval.payload.sessionId
          : undefined;
      const taskId = await createEmployeeTask({
        organizationId: workspace.organization.id,
        employeeId: approval.employeeId,
        title,
        description,
        source: "talk_tool",
        sessionId,
        dueAt,
      });
      await enqueueEmployeeTask({
        taskId,
        organizationId: workspace.organization.id,
        dueAt,
      });
      await recordWorkEvent({
        organizationId: workspace.organization.id,
        employeeId: approval.employeeId,
        eventType: "task_received",
        title,
        summary: description,
        taskId,
        sessionId,
        metadata: {
          source: "talk_tool_approved",
          approvalId: approval.id,
          dueAt: dueAt.toISOString(),
        },
      });
    }

    if (
      input.decision === "approved" &&
      approval.actionType === "request_handoff"
    ) {
      const toEmployeeId =
        typeof approval.payload.toEmployeeId === "string"
          ? approval.payload.toEmployeeId.trim()
          : "";
      const reason =
        typeof approval.payload.reason === "string"
          ? approval.payload.reason.trim()
          : "";
      const contextText =
        typeof approval.payload.context === "string"
          ? approval.payload.context.trim()
          : "";
      if (!toEmployeeId || !reason || !contextText) {
        return { ok: false, message: "Handoff approval payload invalid." };
      }
      const { createEmployeeTask } = await import("@/features/agent-tasks");
      const { employeeHandoff } = await import(
        "@/entities/employee-handoff/schema"
      );
      const sessionId =
        typeof approval.payload.sessionId === "string"
          ? approval.payload.sessionId
          : undefined;
      const toEmployeeName =
        typeof approval.payload.toEmployeeName === "string"
          ? approval.payload.toEmployeeName
          : toEmployeeId;
      const taskId = await createEmployeeTask({
        organizationId: workspace.organization.id,
        employeeId: toEmployeeId,
        title: `Handoff: ${reason}`,
        description: contextText,
        source: "handoff",
        sessionId,
      });
      await db.insert(employeeHandoff).values({
        fromEmployeeId: approval.employeeId,
        toEmployeeId,
        taskId,
        context: { reason, context: contextText },
        status: "pending",
      });
      await recordWorkEvent({
        organizationId: workspace.organization.id,
        employeeId: approval.employeeId,
        eventType: "handoff_created",
        title: `Handoff to ${toEmployeeName}`,
        summary: reason,
        taskId,
        sessionId,
        metadata: {
          toEmployeeId,
          context: contextText,
          approvalId: approval.id,
        },
      });
    }

    if (
      input.decision === "approved" &&
      approval.actionType === "create_and_assign_skill"
    ) {
      const name =
        typeof approval.payload.name === "string"
          ? approval.payload.name.trim()
          : "";
      const instructions =
        typeof approval.payload.instructions === "string"
          ? approval.payload.instructions.trim()
          : "";
      const description =
        typeof approval.payload.description === "string"
          ? approval.payload.description.trim()
          : undefined;
      const keywords = Array.isArray(approval.payload.keywords)
        ? approval.payload.keywords
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 12)
        : [];
      if (!name || !instructions) {
        return { ok: false, message: "Skill approval payload invalid." };
      }
      const { createSkill } = await import(
        "@/features/agent-blueprint/services/create-skill"
      );
      const { assignEmployeeSkills } = await import(
        "@/features/agent-blueprint/services/assign-employee-skills"
      );
      const skillId = await createSkill({
        organizationId: workspace.organization.id,
        name,
        description,
        instructions,
        triggers: {
          keywords,
          intents: ["self_created_skill"],
        },
        requiredToolSlugs: [],
        category: "custom",
        slug: `${name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")
          .slice(0, 48)}_${Date.now().toString(36)}`,
      });
      await assignEmployeeSkills({
        organizationId: workspace.organization.id,
        employeeId: approval.employeeId,
        assignments: [{ skillId, proficiency: "standard", priority: 0 }],
      });
      await recordWorkEvent({
        organizationId: workspace.organization.id,
        employeeId: approval.employeeId,
        eventType: "task_received",
        title: `Skill approved · ${name}`,
        summary: `Skill ${skillId} assigned after human approval`,
        metadata: { skillId, approvalId: approval.id },
      });
    }

    revalidatePath("/settings");
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
