import { and, asc, eq } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import { orgOrSystemScope } from "@/features/agent-blueprint/lib/org-blueprint-scope";
import { db } from "@/shared/db/client";
import { isSystemBlueprintSeeded, seedSystemBlueprintCatalog } from "../services/seed-system-blueprint-catalog";

export async function listOrganizationSkills(organizationId: string) {
  if (!(await isSystemBlueprintSeeded())) {
    await seedSystemBlueprintCatalog();
  }

  return db
    .select()
    .from(skill)
    .where(orgOrSystemScope(organizationId, skill.organizationId))
    .orderBy(asc(skill.isSystemTemplate), asc(skill.category), asc(skill.name));
}

export async function getSkillDetail(input: {
  organizationId: string;
  skillId: string;
}) {
  const [row] = await db
    .select()
    .from(skill)
    .where(
      and(
        eq(skill.id, input.skillId),
        orgOrSystemScope(input.organizationId, skill.organizationId),
      ),
    )
    .limit(1);

  return row ?? null;
}
