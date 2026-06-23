import { and, desc, eq } from "drizzle-orm";
import { employeeTask } from "@/entities/task/schema";
import { db } from "@/shared/db/client";

export type EmployeeTaskItem = {
  id: string;
  title: string;
  description: string;
  status: (typeof employeeTask.$inferSelect)["status"];
  source: (typeof employeeTask.$inferSelect)["source"];
  result: string | null;
  dueAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
};

export async function getEmployeeTasks(
  organizationId: string,
  employeeId: string,
  limit = 50,
): Promise<EmployeeTaskItem[]> {
  const rows = await db
    .select({
      id: employeeTask.id,
      title: employeeTask.title,
      description: employeeTask.description,
      status: employeeTask.status,
      source: employeeTask.source,
      result: employeeTask.result,
      dueAt: employeeTask.dueAt,
      createdAt: employeeTask.createdAt,
      completedAt: employeeTask.completedAt,
    })
    .from(employeeTask)
    .where(
      and(
        eq(employeeTask.employeeId, employeeId),
        eq(employeeTask.organizationId, organizationId),
      ),
    )
    .orderBy(desc(employeeTask.createdAt))
    .limit(limit);

  return rows;
}
