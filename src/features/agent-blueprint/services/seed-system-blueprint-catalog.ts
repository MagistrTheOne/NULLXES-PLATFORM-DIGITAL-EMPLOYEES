import { eq, isNull } from "drizzle-orm";
import { characterPreset } from "@/entities/character-preset/schema";
import { skill } from "@/entities/skill/schema";
import { toolDefinition } from "@/entities/tool-definition/schema";
import {
  getSystemCharacterPresetPrompt,
  getSystemSkillPrompt,
  SYSTEM_CHARACTER_PRESETS,
  SYSTEM_SKILLS,
  SYSTEM_TOOLS,
} from "@/features/agent-blueprint/lib/system-catalog";
import { db } from "@/shared/db/client";

export async function seedSystemBlueprintCatalog(): Promise<void> {
  for (const preset of SYSTEM_CHARACTER_PRESETS) {
    const [existing] = await db
      .select({ id: characterPreset.id })
      .from(characterPreset)
      .where(eq(characterPreset.id, preset.id))
      .limit(1);

    const values = {
      id: preset.id,
      organizationId: null,
      slug: preset.slug,
      name: preset.name,
      description: preset.description,
      traits: preset.traits,
      speechStyle: preset.speechStyle,
      boundaries: preset.boundaries,
      languagePolicy: preset.languagePolicy,
      promptBlock: getSystemCharacterPresetPrompt(preset),
      isSystemTemplate: true,
    };

    if (existing) {
      await db
        .update(characterPreset)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(characterPreset.id, preset.id));
    } else {
      await db.insert(characterPreset).values(values);
    }
  }

  for (const skillSeed of SYSTEM_SKILLS) {
    const [existing] = await db
      .select({ id: skill.id })
      .from(skill)
      .where(eq(skill.id, skillSeed.id))
      .limit(1);

    const values = {
      id: skillSeed.id,
      organizationId: null,
      slug: skillSeed.slug,
      name: skillSeed.name,
      description: skillSeed.description,
      instructions: skillSeed.instructions,
      triggers: skillSeed.triggers,
      requiredToolSlugs: skillSeed.requiredToolSlugs,
      category: skillSeed.category,
      promptBlock: getSystemSkillPrompt(skillSeed),
      isSystemTemplate: true,
    };

    if (existing) {
      await db.update(skill).set({ ...values, updatedAt: new Date() }).where(eq(skill.id, skillSeed.id));
    } else {
      await db.insert(skill).values(values);
    }
  }

  for (const toolSeed of SYSTEM_TOOLS) {
    const [existing] = await db
      .select({ id: toolDefinition.id })
      .from(toolDefinition)
      .where(eq(toolDefinition.id, toolSeed.id))
      .limit(1);

    const values = {
      id: toolSeed.id,
      organizationId: null,
      slug: toolSeed.slug,
      name: toolSeed.name,
      description: toolSeed.description,
      parametersSchema: toolSeed.parametersSchema,
      type: "builtin" as const,
      riskLevel: toolSeed.riskLevel,
      requiresApproval: toolSeed.requiresApproval,
      isActive: true,
      isSystemTemplate: true,
    };

    if (existing) {
      await db
        .update(toolDefinition)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(toolDefinition.id, toolSeed.id));
    } else {
      await db.insert(toolDefinition).values(values);
    }
  }
}

export async function isSystemBlueprintSeeded(): Promise<boolean> {
  const [row] = await db
    .select({ id: characterPreset.id })
    .from(characterPreset)
    .where(isNull(characterPreset.organizationId))
    .limit(1);

  if (!row) {
    return false;
  }

  // Re-seed when catalog grew (e.g. new builtin tools) so upserts land.
  const [skillCreateTool] = await db
    .select({ id: toolDefinition.id })
    .from(toolDefinition)
    .where(eq(toolDefinition.slug, "create_and_assign_skill"))
    .limit(1);

  return Boolean(skillCreateTool);
}
