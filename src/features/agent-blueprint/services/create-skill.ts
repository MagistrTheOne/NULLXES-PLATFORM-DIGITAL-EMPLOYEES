import type { SkillCategory, SkillTriggers } from "@/entities/skill/types";
import { skill } from "@/entities/skill/schema";
import { compileSkillPromptBlock } from "@/features/agent-blueprint/lib/compile-skill-prompt";
import { and, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

export async function createSkill(input: {
  organizationId: string;
  name: string;
  description?: string;
  instructions: string;
  triggers?: SkillTriggers;
  requiredToolSlugs?: string[];
  category?: SkillCategory;
  slug?: string;
}): Promise<string> {
  const slug = input.slug?.trim() || slugify(input.name);
  const triggers = input.triggers ?? { keywords: [], intents: [] };
  const promptBlock = compileSkillPromptBlock({
    name: input.name,
    instructions: input.instructions,
    triggers,
    requiredToolSlugs: input.requiredToolSlugs ?? [],
    proficiency: "standard",
  });

  const [row] = await db
    .insert(skill)
    .values({
      organizationId: input.organizationId,
      slug,
      name: input.name,
      description: input.description ?? null,
      instructions: input.instructions,
      triggers,
      requiredToolSlugs: input.requiredToolSlugs ?? [],
      category: input.category ?? "custom",
      promptBlock,
      isSystemTemplate: false,
    })
    .returning({ id: skill.id });

  return row.id;
}

export async function updateSkill(input: {
  organizationId: string;
  skillId: string;
  name: string;
  description?: string;
  instructions: string;
  triggers?: SkillTriggers;
  requiredToolSlugs?: string[];
  category?: SkillCategory;
}): Promise<void> {
  const [existing] = await db
    .select()
    .from(skill)
    .where(and(eq(skill.id, input.skillId), eq(skill.organizationId, input.organizationId)))
    .limit(1);

  if (!existing || existing.isSystemTemplate) {
    throw new Error("Skill not found or read-only");
  }

  const triggers = input.triggers ?? existing.triggers;
  const promptBlock = compileSkillPromptBlock({
    name: input.name,
    instructions: input.instructions,
    triggers,
    requiredToolSlugs: input.requiredToolSlugs ?? existing.requiredToolSlugs,
    proficiency: "standard",
  });

  await db
    .update(skill)
    .set({
      name: input.name,
      description: input.description ?? null,
      instructions: input.instructions,
      triggers,
      requiredToolSlugs: input.requiredToolSlugs ?? existing.requiredToolSlugs,
      category: input.category ?? existing.category,
      promptBlock,
      updatedAt: new Date(),
    })
    .where(eq(skill.id, input.skillId));
}

export async function deleteSkill(input: {
  organizationId: string;
  skillId: string;
}): Promise<void> {
  const [existing] = await db
    .select({ id: skill.id })
    .from(skill)
    .where(
      and(
        eq(skill.id, input.skillId),
        eq(skill.organizationId, input.organizationId),
        eq(skill.isSystemTemplate, false),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Skill not found or read-only");
  }

  await db.delete(skill).where(eq(skill.id, input.skillId));
}
