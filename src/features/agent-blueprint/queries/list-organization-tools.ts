import { and, asc, eq } from "drizzle-orm";
import { toolDefinition } from "@/entities/tool-definition/schema";
import { orgOrSystemScope } from "@/features/agent-blueprint/lib/org-blueprint-scope";
import { db } from "@/shared/db/client";
import { isSystemBlueprintSeeded, seedSystemBlueprintCatalog } from "../services/seed-system-blueprint-catalog";

export async function listOrganizationTools(organizationId: string) {
  if (!(await isSystemBlueprintSeeded())) {
    await seedSystemBlueprintCatalog();
  }

  return db
    .select()
    .from(toolDefinition)
    .where(orgOrSystemScope(organizationId, toolDefinition.organizationId))
    .orderBy(asc(toolDefinition.slug));
}

export async function listEmployeeToolAssignments(input: {
  organizationId: string;
  employeeId: string;
}) {
  const { employeeTool } = await import("@/entities/employee-tool/schema");

  return db
    .select({
      tool: toolDefinition,
      isEnabled: employeeTool.isEnabled,
      assignmentId: employeeTool.id,
    })
    .from(toolDefinition)
    .leftJoin(
      employeeTool,
      and(
        eq(employeeTool.toolDefinitionId, toolDefinition.id),
        eq(employeeTool.employeeId, input.employeeId),
        eq(employeeTool.organizationId, input.organizationId),
      ),
    )
    .where(orgOrSystemScope(input.organizationId, toolDefinition.organizationId))
    .orderBy(asc(toolDefinition.slug));
}
