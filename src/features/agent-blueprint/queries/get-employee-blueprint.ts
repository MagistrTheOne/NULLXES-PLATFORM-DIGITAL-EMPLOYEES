import { and, asc, eq } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { employeeCharacter } from "@/entities/employee-character/schema";
import { employeeSkill } from "@/entities/employee-skill/schema";
import { employeeTool } from "@/entities/employee-tool/schema";
import { skill } from "@/entities/skill/schema";
import { toolDefinition } from "@/entities/tool-definition/schema";
import { orgOrSystemScope } from "@/features/agent-blueprint/lib/org-blueprint-scope";
import { db } from "@/shared/db/client";
import {
  isSystemBlueprintSeeded,
  seedSystemBlueprintCatalog,
} from "../services/seed-system-blueprint-catalog";

export type EmployeeBlueprint = {
  characterPromptBlock: string | null;
  activeSkills: Array<{
    slug: string;
    promptBlock: string;
    proficiency: "basic" | "standard" | "expert";
  }>;
  enabledToolSlugs: string[];
};

export async function getEmployeeBlueprint(input: {
  organizationId: string;
  employeeId: string;
}): Promise<EmployeeBlueprint> {
  if (!(await isSystemBlueprintSeeded())) {
    await seedSystemBlueprintCatalog();
  }

  const [characterRow, skillRows, toolRows] = await Promise.all([
    db
      .select({
        compiledPromptBlock: employeeCharacter.compiledPromptBlock,
      })
      .from(employeeCharacter)
      .where(
        and(
          eq(employeeCharacter.organizationId, input.organizationId),
          eq(employeeCharacter.employeeId, input.employeeId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({
        slug: skill.slug,
        promptBlock: skill.promptBlock,
        proficiency: employeeSkill.proficiency,
        priority: employeeSkill.priority,
      })
      .from(employeeSkill)
      .innerJoin(skill, eq(employeeSkill.skillId, skill.id))
      .where(
        and(
          eq(employeeSkill.organizationId, input.organizationId),
          eq(employeeSkill.employeeId, input.employeeId),
          eq(employeeSkill.isActive, true),
        ),
      )
      .orderBy(asc(employeeSkill.priority)),
    db
      .select({
        slug: toolDefinition.slug,
      })
      .from(employeeTool)
      .innerJoin(toolDefinition, eq(employeeTool.toolDefinitionId, toolDefinition.id))
      .where(
        and(
          eq(employeeTool.organizationId, input.organizationId),
          eq(employeeTool.employeeId, input.employeeId),
          eq(employeeTool.isEnabled, true),
          eq(toolDefinition.isActive, true),
        ),
      ),
  ]);

  return {
    characterPromptBlock: characterRow?.compiledPromptBlock ?? null,
    activeSkills: skillRows.map((row) => ({
      slug: row.slug,
      promptBlock: row.promptBlock,
      proficiency: row.proficiency,
    })),
    enabledToolSlugs: toolRows.map((row) => row.slug),
  };
}

export async function getCharacterPresetBySlug(input: {
  organizationId: string;
  slug: string;
}) {
  const [row] = await db
    .select()
    .from(characterPreset)
    .where(
      and(
        eq(characterPreset.slug, input.slug),
        orgOrSystemScope(input.organizationId, characterPreset.organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getSkillBySlug(input: {
  organizationId: string;
  slug: string;
}) {
  const [row] = await db
    .select()
    .from(skill)
    .where(
      and(
        eq(skill.slug, input.slug),
        orgOrSystemScope(input.organizationId, skill.organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getToolDefinitionBySlug(input: {
  organizationId: string;
  slug: string;
}) {
  const [row] = await db
    .select()
    .from(toolDefinition)
    .where(
      and(
        eq(toolDefinition.slug, input.slug),
        orgOrSystemScope(input.organizationId, toolDefinition.organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}
