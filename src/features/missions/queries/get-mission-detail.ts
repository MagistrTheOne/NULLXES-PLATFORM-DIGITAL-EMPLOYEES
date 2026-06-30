import { and, eq } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";

export type MissionDetail = {
  id: string;
  title: string;
  brief: string;
  type: "prospecting" | "custom";
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

  return {
    ...row,
    evidence: row.evidence ?? [],
    leads: row.leads ?? [],
    timeline: row.timeline ?? [],
  };
}
