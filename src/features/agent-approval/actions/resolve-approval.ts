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

    revalidatePath("/settings");
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access denied",
    };
  }
}
