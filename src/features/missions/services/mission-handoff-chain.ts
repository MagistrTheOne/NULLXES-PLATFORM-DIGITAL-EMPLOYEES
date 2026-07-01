import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  employeeMission,
  type MissionHandoffItem,
  type MissionLeadItem,
  type MissionTimelineStep,
} from "@/entities/employee-mission";
import { employeeHandoff } from "@/entities/employee-handoff/schema";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import {
  createEmployeeTask,
  enqueueEmployeeTask,
} from "@/features/agent-tasks";
import { resolveWorkforceHandoffTarget } from "@/features/employees/services/resolve-workforce-handoff-target";
import { appendMissionTimelineStep } from "@/features/missions/lib/append-mission-timeline-step";
import { recordWorkEvent } from "@/features/work-event";
import { db } from "@/shared/db/client";

type MissionHandoffStage = {
  stage: string;
  roleQueries: string[];
  title: string;
  buildDescription: (input: {
    missionTitle: string;
    missionBrief: string;
    leads: MissionLeadItem[];
    priorSummary?: string;
  }) => string;
};

const MISSION_HANDOFF_STAGES: MissionHandoffStage[] = [
  {
    stage: "legal_review",
    roleQueries: ["legal", "compliance", "marketing"],
    title: "Legal review of outbound proposals",
    buildDescription: ({ missionTitle, missionBrief, leads }) => {
      const proposalLines = leads
        .filter((lead) => lead.sentAt)
        .map(
          (lead) =>
            `- ${lead.companyName}${lead.domain ? ` (${lead.domain})` : ""}\n  To: ${lead.contactEmail ?? "unknown"}\n  Proposal: ${lead.proposalDraft.slice(0, 1200)}`,
        )
        .join("\n\n");

      return [
        `Mission: ${missionTitle}`,
        "",
        "Review the outbound commercial proposals below for compliance, claims accuracy, and enterprise-appropriate tone.",
        "Return a concise legal/commercial review with risks, required edits, and approval guidance.",
        "",
        `Mission brief: ${missionBrief}`,
        "",
        "Sent proposals:",
        proposalLines || "No sent proposals were recorded.",
      ].join("\n");
    },
  },
  {
    stage: "automation_plan",
    roleQueries: ["automation", "engineer", "operations", "workflow"],
    title: "Automation follow-up plan",
    buildDescription: ({ missionTitle, missionBrief, leads, priorSummary }) => {
      const sentCount = leads.filter((lead) => lead.sentAt).length;

      return [
        `Mission: ${missionTitle}`,
        "",
        "Design the automation follow-up plan for this prospecting mission.",
        "Include recommended integrations, follow-up timing, and operational next steps for the digital workforce.",
        "",
        `Mission brief: ${missionBrief}`,
        `Sent proposals: ${sentCount}`,
        "",
        "Prior review:",
        priorSummary ?? "No prior review available.",
      ].join("\n");
    },
  },
];

function buildHandoffItem(input: {
  handoffId: string;
  fromEmployeeId: string;
  target: { id: string; name: string; role: string };
  stage: string;
  taskId?: string;
  status: MissionHandoffItem["status"];
  summary?: string;
}): MissionHandoffItem {
  return {
    handoffId: input.handoffId,
    fromEmployeeId: input.fromEmployeeId,
    toEmployeeId: input.target.id,
    toEmployeeName: input.target.name,
    role: input.target.role,
    stage: input.stage,
    taskId: input.taskId,
    status: input.status,
    summary: input.summary,
    completedAt:
      input.status === "completed" || input.status === "skipped"
        ? new Date().toISOString()
        : undefined,
  };
}

async function loadMissionForHandoff(missionId: string, organizationId: string) {
  const [mission] = await db
    .select({
      id: employeeMission.id,
      organizationId: employeeMission.organizationId,
      employeeId: employeeMission.employeeId,
      title: employeeMission.title,
      brief: employeeMission.brief,
      leads: employeeMission.leads,
      handoffs: employeeMission.handoffs,
      timeline: employeeMission.timeline,
      employeeName: digitalEmployee.name,
    })
    .from(employeeMission)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, employeeMission.employeeId),
    )
    .where(
      and(
        eq(employeeMission.id, missionId),
        eq(employeeMission.organizationId, organizationId),
      ),
    )
    .limit(1);

  return mission ?? null;
}

async function persistMissionHandoffs(input: {
  missionId: string;
  handoffs: MissionHandoffItem[];
  timeline: MissionTimelineStep[];
  status?: typeof employeeMission.$inferSelect.status;
  completedAt?: Date | null;
}) {
  await db
    .update(employeeMission)
    .set({
      handoffs: input.handoffs,
      timeline: input.timeline,
      ...(input.status ? { status: input.status } : {}),
      ...(input.completedAt !== undefined
        ? { completedAt: input.completedAt }
        : {}),
    })
    .where(eq(employeeMission.id, input.missionId));
}

export async function startMissionHandoffStage(input: {
  missionId: string;
  organizationId: string;
  stageIndex: number;
  priorSummary?: string;
}): Promise<{ started: boolean; reason?: string }> {
  const mission = await loadMissionForHandoff(input.missionId, input.organizationId);
  if (!mission) {
    return { started: false, reason: "mission_not_found" };
  }

  const stage = MISSION_HANDOFF_STAGES[input.stageIndex];
  if (!stage) {
    const timeline = appendMissionTimelineStep(mission.timeline ?? [], {
      key: "mission_closed",
      label: "Mission workforce handoff complete",
    });

    await persistMissionHandoffs({
      missionId: input.missionId,
      handoffs: mission.handoffs ?? [],
      timeline,
      status: "completed",
      completedAt: new Date(),
    });

    return { started: false, reason: "pipeline_complete" };
  }

  const target = await resolveWorkforceHandoffTarget({
    organizationId: input.organizationId,
    fromEmployeeId: mission.employeeId,
    roleQueries: stage.roleQueries,
  });

  const handoffs = [...(mission.handoffs ?? [])];

  if (!target) {
    handoffs.push(
      buildHandoffItem({
        handoffId: randomUUID(),
        fromEmployeeId: mission.employeeId,
        target: {
          id: randomUUID(),
          name: "No matching employee",
          role: stage.roleQueries.join(" · "),
        },
        stage: stage.stage,
        status: "skipped",
        summary: `No digital employee in this organization matched: ${stage.roleQueries.join(", ")}.`,
      }),
    );

    const timeline = appendMissionTimelineStep(mission.timeline ?? [], {
      key: `handoff_skipped_${stage.stage}`,
      label: `${stage.title} skipped · no matching employee`,
    });

    await persistMissionHandoffs({
      missionId: input.missionId,
      handoffs,
      timeline,
    });

    return startMissionHandoffStage({
      missionId: input.missionId,
      organizationId: input.organizationId,
      stageIndex: input.stageIndex + 1,
      priorSummary: input.priorSummary,
    });
  }

  const description = stage.buildDescription({
    missionTitle: mission.title,
    missionBrief: mission.brief,
    leads: mission.leads ?? [],
    priorSummary: input.priorSummary,
  });

  const taskId = await createEmployeeTask({
    organizationId: input.organizationId,
    employeeId: target.id,
    title: `${stage.title} · ${mission.title}`,
    description,
    source: "handoff",
  });

  const [handoff] = await db
    .insert(employeeHandoff)
    .values({
      fromEmployeeId: mission.employeeId,
      toEmployeeId: target.id,
      taskId,
      context: {
        missionId: input.missionId,
        stage: stage.stage,
        stageIndex: input.stageIndex,
        reason: stage.title,
        context: description,
        orchestrated: true,
      },
      status: "accepted",
    })
    .returning({ id: employeeHandoff.id });

  handoffs.push(
    buildHandoffItem({
      handoffId: handoff?.id ?? taskId,
      fromEmployeeId: mission.employeeId,
      target,
      stage: stage.stage,
      taskId,
      status: "working",
    }),
  );

  const timeline = appendMissionTimelineStep(mission.timeline ?? [], {
    key: `handoff_${stage.stage}`,
    label: `Handed off to ${target.name} · ${stage.title}`,
  });

  await persistMissionHandoffs({
    missionId: input.missionId,
    handoffs,
    timeline,
    status: "working",
    completedAt: null,
  });

  await enqueueEmployeeTask({
    taskId,
    organizationId: input.organizationId,
  });

  await recordWorkEvent({
    organizationId: input.organizationId,
    employeeId: mission.employeeId,
    taskId,
    eventType: "handoff_created",
    title: `Mission handoff to ${target.name}`,
    summary: stage.title,
    metadata: {
      missionId: input.missionId,
      handoffId: handoff?.id,
      stage: stage.stage,
      orchestrated: true,
    },
  });

  return { started: true };
}

export async function startMissionHandoffChain(input: {
  missionId: string;
  organizationId: string;
}): Promise<void> {
  await startMissionHandoffStage({
    missionId: input.missionId,
    organizationId: input.organizationId,
    stageIndex: 0,
  });
}

export async function completeMissionHandoffStep(input: {
  taskId: string;
  organizationId: string;
  result: string;
}): Promise<{ handled: boolean }> {
  const [handoff] = await db
    .select()
    .from(employeeHandoff)
    .where(eq(employeeHandoff.taskId, input.taskId))
    .limit(1);

  const missionId =
    typeof handoff?.context?.missionId === "string"
      ? handoff.context.missionId
      : null;

  if (!handoff || !missionId || handoff.context?.orchestrated !== true) {
    return { handled: false };
  }

  const stageIndex =
    typeof handoff.context.stageIndex === "number"
      ? handoff.context.stageIndex
      : 0;

  const mission = await loadMissionForHandoff(missionId, input.organizationId);
  if (!mission) {
    return { handled: false };
  }

  const handoffs = (mission.handoffs ?? []).map((item) =>
    item.taskId === input.taskId
      ? {
          ...item,
          status: "completed" as const,
          summary: input.result.slice(0, 2000),
          completedAt: new Date().toISOString(),
        }
      : item,
  );

  const timeline = appendMissionTimelineStep(mission.timeline ?? [], {
    key: `handoff_completed_${handoff.context.stage ?? "stage"}`,
    label: `${handoffs.find((item) => item.taskId === input.taskId)?.toEmployeeName ?? "Employee"} completed mission handoff`,
  });

  await db
    .update(employeeHandoff)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(employeeHandoff.id, handoff.id));

  await persistMissionHandoffs({
    missionId,
    handoffs,
    timeline,
    status: "working",
  });

  await recordWorkEvent({
    organizationId: input.organizationId,
    employeeId: handoff.toEmployeeId,
    taskId: input.taskId,
    eventType: "task_completed",
    title: `Mission handoff completed · ${mission.title}`,
    summary: input.result.slice(0, 500),
    metadata: { missionId, handoffId: handoff.id, stageIndex },
  });

  await startMissionHandoffStage({
    missionId,
    organizationId: input.organizationId,
    stageIndex: stageIndex + 1,
    priorSummary: input.result,
  });

  return { handled: true };
}
