import { count, desc, eq, inArray } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { db } from "@/shared/db/client";
import type { EmployeeListItem } from "../types";

export async function listOrganizationEmployees(
  organizationId: string,
): Promise<EmployeeListItem[]> {
  const employees = await db
    .select()
    .from(digitalEmployee)
    .where(eq(digitalEmployee.organizationId, organizationId))
    .orderBy(desc(digitalEmployee.createdAt));

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((employee) => employee.id);

  const knowledgeCounts = await db
    .select({
      employeeId: knowledgeSource.employeeId,
      knowledgeSourcesCount: count(),
    })
    .from(knowledgeSource)
    .where(inArray(knowledgeSource.employeeId, employeeIds))
    .groupBy(knowledgeSource.employeeId);

  const countByEmployeeId = new Map(
    knowledgeCounts.map((row) => [
      row.employeeId,
      Number(row.knowledgeSourcesCount),
    ]),
  );

  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    role: employee.role,
    status: employee.status,
    avatarProvider: employee.avatarProvider,
    brainProvider: employee.brainProvider,
    knowledgeSourcesCount: countByEmployeeId.get(employee.id) ?? 0,
    createdAt: employee.createdAt,
  }));
}
