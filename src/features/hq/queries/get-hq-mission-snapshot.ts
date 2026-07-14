import { and, desc, eq, inArray } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission/schema";
import type { MissionHandoffItem, MissionTimelineStep } from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import type { HqMissionHint } from "../lib/agent-office-state";
import type { HqOpsItem, HqTimelineEvent } from "../types";

const ACTIVE_STATUSES = [
  "planned",
  "working",
  "waiting_approval",
] as const;

function mapStage(
  status: string,
  timeline: MissionTimelineStep[],
): HqMissionHint["stage"] {
  if (status === "waiting_approval") {
    return "awaiting_approval";
  }
  if (status === "completed") {
    return "sent";
  }
  const keys = timeline.map((step) => step.key.toLowerCase());
  const labels = timeline.map((step) => step.label.toLowerCase());
  const blob = [...keys, ...labels].join(" ");
  if (blob.includes("sent") || blob.includes("outbound") || blob.includes("deliver")) {
    return "sent";
  }
  if (blob.includes("draft") || blob.includes("propos") || blob.includes("writ")) {
    return "draft";
  }
  if (blob.includes("research") || blob.includes("prospect") || blob.includes("evidence")) {
    return "research";
  }
  if (status === "working" || status === "planned") {
    return "research";
  }
  return null;
}

/**
 * One query: active missions for HQ ops table, timeline, and per-employee hints.
 */
export async function getHqMissionSnapshot(organizationId: string): Promise<{
  opsItems: HqOpsItem[];
  recentTimeline: HqTimelineEvent[];
  missionByEmployeeId: Map<string, HqMissionHint>;
}> {
  const rows = await db
    .select({
      id: employeeMission.id,
      employeeId: employeeMission.employeeId,
      employeeName: digitalEmployee.name,
      title: employeeMission.title,
      status: employeeMission.status,
      timeline: employeeMission.timeline,
      handoffs: employeeMission.handoffs,
      updatedAt: employeeMission.updatedAt,
    })
    .from(employeeMission)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, employeeMission.employeeId),
    )
    .where(
      and(
        eq(employeeMission.organizationId, organizationId),
        inArray(employeeMission.status, [...ACTIVE_STATUSES, "completed", "failed"]),
      ),
    )
    .orderBy(desc(employeeMission.updatedAt))
    .limit(40);

  const missionByEmployeeId = new Map<string, HqMissionHint>();
  const opsItems: HqOpsItem[] = [];
  const timelineEvents: HqTimelineEvent[] = [];

  for (const row of rows) {
    const timeline = row.timeline ?? [];
    const stage = mapStage(row.status, timeline);
    const lastStep = timeline[timeline.length - 1] ?? null;
    const handoffs = (row.handoffs ?? []) as MissionHandoffItem[];

    if (
      ACTIVE_STATUSES.includes(row.status as (typeof ACTIVE_STATUSES)[number]) &&
      !missionByEmployeeId.has(row.employeeId)
    ) {
      missionByEmployeeId.set(row.employeeId, {
        missionId: row.id,
        title: row.title,
        status: row.status,
        stage,
        lastAction: lastStep?.label ?? null,
      });
    }

    if (row.status === "waiting_approval" && opsItems.length < 6) {
      opsItems.push({
        id: `approval-${row.id}`,
        kind: "approval",
        title: row.title,
        subtitle: row.employeeName,
        employeeId: row.employeeId,
        missionId: row.id,
        at: row.updatedAt.toISOString(),
      });
    }

    if (row.status === "working" && opsItems.length < 6) {
      opsItems.push({
        id: `mission-${row.id}`,
        kind: "mission",
        title: row.title,
        subtitle: row.employeeName,
        employeeId: row.employeeId,
        missionId: row.id,
        at: row.updatedAt.toISOString(),
      });
    }

    const pendingHandoff = handoffs.find(
      (handoff) => handoff.status === "pending" || handoff.status === "working",
    );
    if (pendingHandoff && opsItems.length < 6) {
      opsItems.push({
        id: `handoff-${row.id}-${pendingHandoff.handoffId}`,
        kind: "handoff",
        title: row.title,
        subtitle: pendingHandoff.toEmployeeName
          ? `→ ${pendingHandoff.toEmployeeName}`
          : pendingHandoff.stage || "Handoff",
        employeeId: row.employeeId,
        missionId: row.id,
        at: row.updatedAt.toISOString(),
      });
    }

    for (const step of timeline.slice(-3)) {
      timelineEvents.push({
        id: `${row.id}-${step.at}-${step.key}`,
        kind: "mission",
        missionId: row.id,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        key: step.key,
        label: step.label,
        at: step.at,
        missionTitle: row.title,
      });
    }
  }

  timelineEvents.sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );

  const ranked = [
    ...opsItems.filter((item) => item.kind === "approval"),
    ...opsItems.filter((item) => item.kind === "handoff"),
    ...opsItems.filter((item) => item.kind === "mission" || item.kind === "escalation"),
  ].slice(0, 6);

  return {
    opsItems: ranked,
    recentTimeline: timelineEvents.slice(0, 5),
    missionByEmployeeId,
  };
}
