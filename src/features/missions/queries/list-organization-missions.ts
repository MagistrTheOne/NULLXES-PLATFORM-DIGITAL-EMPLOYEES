import { and, desc, eq, lt } from "drizzle-orm";
import { employeeMission } from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";

export type MissionListItem = {
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
  employeeId: string;
  employeeName: string;
  leadsCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function listOrganizationMissions(
  organizationId: string,
  options?: { limit?: number; cursor?: string },
): Promise<{ items: MissionListItem[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;

  const rows = await db
    .select({
      id: employeeMission.id,
      title: employeeMission.title,
      brief: employeeMission.brief,
      type: employeeMission.type,
      status: employeeMission.status,
      employeeId: employeeMission.employeeId,
      employeeName: digitalEmployee.name,
      leads: employeeMission.leads,
      createdAt: employeeMission.createdAt,
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
        options?.cursor
          ? lt(employeeMission.createdAt, new Date(options.cursor))
          : undefined,
      ),
    )
    .orderBy(desc(employeeMission.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      title: row.title,
      brief: row.brief,
      type: row.type,
      status: row.status,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      leadsCount: Array.isArray(row.leads) ? row.leads.length : 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null,
  };
}
