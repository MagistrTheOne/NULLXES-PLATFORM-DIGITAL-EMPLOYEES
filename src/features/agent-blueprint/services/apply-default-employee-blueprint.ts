import { and, eq } from "drizzle-orm";
import { employeeTool } from "@/entities/employee-tool/schema";
import { toolDefinition } from "@/entities/tool-definition/schema";
import {
  DEFAULT_ENABLED_TOOL_SLUGS,
  resolveDefaultCharacterPresetSlug,
  resolveDefaultSkillSlugs,
} from "@/features/agent-blueprint/lib/system-catalog";
import { getCharacterPresetBySlug, getSkillBySlug, getToolDefinitionBySlug } from "../queries/get-employee-blueprint";
import { assignEmployeeSkills } from "./assign-employee-skills";
import { seedSystemBlueprintCatalog } from "./seed-system-blueprint-catalog";
import { syncEmployeeTool } from "./sync-employee-tools";
import { upsertEmployeeCharacter } from "./upsert-employee-character";
import { db } from "@/shared/db/client";

export async function applyDefaultEmployeeBlueprint(input: {
  organizationId: string;
  employeeId: string;
  role: string;
}): Promise<void> {
  await seedSystemBlueprintCatalog();

  const presetSlug = resolveDefaultCharacterPresetSlug(input.role);
  const preset = await getCharacterPresetBySlug({
    organizationId: input.organizationId,
    slug: presetSlug,
  });

  await upsertEmployeeCharacter({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    presetId: preset?.id ?? null,
    traitOverrides: {},
  });

  const skillSlugs = resolveDefaultSkillSlugs(input.role);
  const skillAssignments = [];
  for (const [index, slug] of skillSlugs.entries()) {
    const skillRow = await getSkillBySlug({
      organizationId: input.organizationId,
      slug,
    });
    if (skillRow) {
      skillAssignments.push({
        skillId: skillRow.id,
        priority: index,
        isActive: true,
      });
    }
  }

  if (skillAssignments.length > 0) {
    await assignEmployeeSkills({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      assignments: skillAssignments,
    });
  }

  for (const slug of DEFAULT_ENABLED_TOOL_SLUGS) {
    const tool = await getToolDefinitionBySlug({
      organizationId: input.organizationId,
      slug,
    });
    if (!tool) {
      continue;
    }

    const [existing] = await db
      .select({ id: employeeTool.id })
      .from(employeeTool)
      .where(
        and(
          eq(employeeTool.employeeId, input.employeeId),
          eq(employeeTool.toolDefinitionId, tool.id),
        ),
      )
      .limit(1);

    if (!existing) {
      await syncEmployeeTool({
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        toolDefinitionId: tool.id,
        isEnabled: true,
      });
    }
  }
}
