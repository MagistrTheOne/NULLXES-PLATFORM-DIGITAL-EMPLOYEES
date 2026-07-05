import { inArray } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import { db } from "@/shared/db/client";

export async function resolveMissionSkillPromptBlocks(
  skillIds: string[],
): Promise<string[]> {
  if (skillIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ promptBlock: skill.promptBlock })
    .from(skill)
    .where(inArray(skill.id, skillIds));

  return rows.map((row) => row.promptBlock).filter(Boolean);
}
