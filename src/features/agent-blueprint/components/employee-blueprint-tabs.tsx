import { and, eq } from "drizzle-orm";
import { employeeCharacter } from "@/entities/employee-character/schema";
import { requireWorkspacePermission } from "@/features/workspace";
import { listEmployeeSkillAssignments } from "../services/assign-employee-skills";
import { listEmployeeToolAssignments } from "../queries/list-organization-tools";
import { listOrganizationCharacterPresets } from "../queries/list-organization-character-presets";
import { listOrganizationSkills } from "../queries/list-organization-skills";
import { EmployeeCharacterTab } from "./employee-character-tab";
import { EmployeeSkillsTab } from "./employee-skills-tab";
import { EmployeeToolsTab } from "./employee-tools-tab";
import { db } from "@/shared/db/client";

export async function EmployeeBlueprintTabs({
  organizationId,
  employeeId,
  tab,
}: {
  organizationId: string;
  employeeId: string;
  tab: "character" | "skills" | "tools";
}) {
  const workspace = await requireWorkspacePermission("canManageEmployees").catch(
    () => null,
  );
  const canManage = Boolean(workspace);

  const [presets, library, assignments, toolRows, character] = await Promise.all([
    listOrganizationCharacterPresets(organizationId),
    listOrganizationSkills(organizationId),
    listEmployeeSkillAssignments({ organizationId, employeeId }),
    listEmployeeToolAssignments({ organizationId, employeeId }),
    db
      .select()
      .from(employeeCharacter)
      .where(
        and(
          eq(employeeCharacter.organizationId, organizationId),
          eq(employeeCharacter.employeeId, employeeId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  if (tab === "character") {
    return (
      <EmployeeCharacterTab
        organizationId={organizationId}
        employeeId={employeeId}
        presets={presets}
        character={character}
        canManage={canManage}
      />
    );
  }

  if (tab === "skills") {
    return (
      <EmployeeSkillsTab
        employeeId={employeeId}
        library={library}
        assignments={assignments.map((row) => ({
          skillId: row.skill.id,
          skillName: row.skill.name,
          skillSlug: row.skill.slug,
          proficiency: row.assignment.proficiency,
          priority: row.assignment.priority,
          isActive: row.assignment.isActive,
        }))}
        canManage={canManage}
      />
    );
  }

  return (
    <EmployeeToolsTab
      employeeId={employeeId}
      canManage={canManage}
      tools={toolRows.map((row) => ({
        toolDefinitionId: row.tool.id,
        slug: row.tool.slug,
        name: row.tool.name,
        description: row.tool.description,
        riskLevel: row.tool.riskLevel,
        requiresApproval: row.tool.requiresApproval,
        isEnabled: row.isEnabled ?? false,
      }))}
    />
  );
}
