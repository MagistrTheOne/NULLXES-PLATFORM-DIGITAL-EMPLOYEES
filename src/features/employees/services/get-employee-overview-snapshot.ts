import { and, count, desc, eq } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import { employeeMission } from "@/entities/employee-mission";
import { employeeSkill } from "@/entities/employee-skill/schema";
import { db } from "@/shared/db/client";
import { getEmployeeDetailLifecycle } from "./get-employee-detail";

export type EmployeeOverviewMissionItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
};

export type EmployeeOverviewSnapshot = {
  activeSkillsCount: number;
  characterPresetName: string | null;
  missionsTotal: number;
  missionsCompleted: number;
  recentMissions: EmployeeOverviewMissionItem[];
  recentLifecycle: Awaited<
    ReturnType<typeof getEmployeeDetailLifecycle>
  >["lifecycle"];
};

export async function getEmployeeOverviewSnapshot(
  organizationId: string,
  employeeId: string,
): Promise<EmployeeOverviewSnapshot> {
  const [
    lifecycleData,
    recentMissions,
    totalRow,
    completedRow,
    activeSkillsRow,
    characterRow,
  ] = await Promise.all([
    getEmployeeDetailLifecycle(organizationId, employeeId),
    db
      .select({
        id: employeeMission.id,
        title: employeeMission.title,
        status: employeeMission.status,
        updatedAt: employeeMission.updatedAt,
      })
      .from(employeeMission)
      .where(
        and(
          eq(employeeMission.organizationId, organizationId),
          eq(employeeMission.employeeId, employeeId),
        ),
      )
      .orderBy(desc(employeeMission.updatedAt))
      .limit(5),
    db
      .select({ count: count() })
      .from(employeeMission)
      .where(
        and(
          eq(employeeMission.organizationId, organizationId),
          eq(employeeMission.employeeId, employeeId),
        ),
      ),
    db
      .select({ count: count() })
      .from(employeeMission)
      .where(
        and(
          eq(employeeMission.organizationId, organizationId),
          eq(employeeMission.employeeId, employeeId),
          eq(employeeMission.status, "completed"),
        ),
      ),
    db
      .select({ count: count() })
      .from(employeeSkill)
      .where(
        and(
          eq(employeeSkill.organizationId, organizationId),
          eq(employeeSkill.employeeId, employeeId),
          eq(employeeSkill.isActive, true),
        ),
      ),
    db
      .select({
        presetId: employeeCharacter.presetId,
        presetName: characterPreset.name,
      })
      .from(employeeCharacter)
      .leftJoin(
        characterPreset,
        eq(employeeCharacter.presetId, characterPreset.id),
      )
      .where(
        and(
          eq(employeeCharacter.organizationId, organizationId),
          eq(employeeCharacter.employeeId, employeeId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  return {
    activeSkillsCount: Number(activeSkillsRow[0]?.count ?? 0),
    characterPresetName: characterRow?.presetName ?? null,
    missionsTotal: Number(totalRow[0]?.count ?? 0),
    missionsCompleted: Number(completedRow[0]?.count ?? 0),
    recentMissions: recentMissions.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      updatedAt: row.updatedAt,
    })),
    recentLifecycle: lifecycleData.lifecycle.slice(0, 5),
  };
}
