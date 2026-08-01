import { and, eq, inArray } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { skill } from "@/entities/skill/schema";
import { db } from "@/shared/db/client";

import type { MissionType } from "../lib/mission-type";

export type MissionDetail = {
  id: string;
  title: string;
  goal: string | null;
  skills: string[];
  skillIds: string[];
  brief: string;
  type: MissionType;
  status:
    | "planned"
    | "working"
    | "waiting_approval"
    | "completed"
    | "failed"
    | "cancelled";
  plan: string | null;
  evidence: NonNullable<typeof employeeMission.$inferSelect["evidence"]>;
  leads: NonNullable<typeof employeeMission.$inferSelect["leads"]>;
  timeline: NonNullable<typeof employeeMission.$inferSelect["timeline"]>;
  errorMessage: string | null;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  source: "manual" | "scheduled";
  scheduleId: string | null;
  handoffs: NonNullable<typeof employeeMission.$inferSelect["handoffs"]>;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export async function getMissionDetail(
  organizationId: string,
  missionId: string,
): Promise<MissionDetail | null> {
  const [row] = await db
    .select({
      id: employeeMission.id,
      title: employeeMission.title,
      goal: employeeMission.goal,
      skills: employeeMission.skills,
      skillIds: employeeMission.skillIds,
      brief: employeeMission.brief,
      type: employeeMission.type,
      status: employeeMission.status,
      plan: employeeMission.plan,
      evidence: employeeMission.evidence,
      leads: employeeMission.leads,
      timeline: employeeMission.timeline,
      errorMessage: employeeMission.errorMessage,
      employeeId: employeeMission.employeeId,
      employeeName: digitalEmployee.name,
      employeeRole: digitalEmployee.role,
      source: employeeMission.source,
      scheduleId: employeeMission.scheduleId,
      handoffs: employeeMission.handoffs,
      createdAt: employeeMission.createdAt,
      updatedAt: employeeMission.updatedAt,
      completedAt: employeeMission.completedAt,
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

  if (!row) {
    return null;
  }

  const skillIds = row.skillIds ?? [];
  let skills = row.skills ?? [];

  if (skillIds.length > 0) {
    const skillRows = await db
      .select({ id: skill.id, name: skill.name })
      .from(skill)
      .where(inArray(skill.id, skillIds));
    const nameById = new Map(skillRows.map((s) => [s.id, s.name]));
    const resolved = skillIds
      .map((id) => nameById.get(id))
      .filter((name): name is string => Boolean(name));
    if (resolved.length > 0) {
      skills = resolved;
    }
  }

  return {
    ...row,
    goal: row.goal ?? null,
    skills,
    skillIds,
    evidence: row.evidence ?? [],
    leads: row.leads ?? [],
    handoffs: row.handoffs ?? [],
    timeline: row.timeline ?? [],
  };
}
