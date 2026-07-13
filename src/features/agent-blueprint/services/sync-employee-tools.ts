import { and, eq } from "drizzle-orm";
import { employeeTool } from "@/entities/employee-tool/schema";
import { toolDefinition } from "@/entities/tool-definition/schema";
import { orgOrSystemScope } from "@/features/agent-blueprint/lib/org-blueprint-scope";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { db } from "@/shared/db/client";
import { forbidCatalogMutation } from "@/features/employees/services/platform-employee-catalog";

export async function syncEmployeeTool(input: {
  organizationId: string;
  employeeId: string;
  toolDefinitionId: string;
  isEnabled: boolean;
}): Promise<void> {
  await forbidCatalogMutation(input.employeeId);

  const [employee] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.id, input.employeeId),
        eq(digitalEmployee.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const [tool] = await db
    .select({ id: toolDefinition.id })
    .from(toolDefinition)
    .where(
      and(
        eq(toolDefinition.id, input.toolDefinitionId),
        orgOrSystemScope(input.organizationId, toolDefinition.organizationId),
      ),
    )
    .limit(1);

  if (!tool) {
    throw new Error("Tool not found");
  }

  const [existing] = await db
    .select({ id: employeeTool.id })
    .from(employeeTool)
    .where(
      and(
        eq(employeeTool.employeeId, input.employeeId),
        eq(employeeTool.toolDefinitionId, input.toolDefinitionId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(employeeTool)
      .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
      .where(eq(employeeTool.id, existing.id));
    return;
  }

  await db.insert(employeeTool).values({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    toolDefinitionId: input.toolDefinitionId,
    isEnabled: input.isEnabled,
  });
}

export async function setOrganizationToolActive(input: {
  organizationId: string;
  toolDefinitionId: string;
  isActive: boolean;
}): Promise<void> {
  const [tool] = await db
    .select()
    .from(toolDefinition)
    .where(eq(toolDefinition.id, input.toolDefinitionId))
    .limit(1);

  if (!tool) {
    throw new Error("Tool not found");
  }

  if (tool.organizationId === null) {
    throw new Error("System tools cannot be deactivated globally");
  }

  if (tool.organizationId !== input.organizationId) {
    throw new Error("Tool not found");
  }

  await db
    .update(toolDefinition)
    .set({ isActive: input.isActive, updatedAt: new Date() })
    .where(eq(toolDefinition.id, input.toolDefinitionId));
}
