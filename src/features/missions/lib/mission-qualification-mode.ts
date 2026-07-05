import { inArray } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import { db } from "@/shared/db/client";

export const RU_MARKET_QUALIFICATION_SLUG = "ru_market_qualification";
export const RU_MARKET_QUALIFICATION_SKILL_ID =
  "b2000002-0002-4002-8002-000000000009";

export const RU_PROSPECTING_PLAN = `1. Web research: российские B2B компании по brief.
2. Квалификация: страна РФ (с evidence), сектор, стаж на рынке, выручка только из источников.
3. Контакт: реальный decision-maker с email дословно из research — без контакта компанию пропустить.
4. План захода (agentPlan) от digital employee на каждую qualified компанию.
5. Digest CEO + approval перед outbound.`;

export async function missionUsesRuQualification(input: {
  organizationId: string;
  skillIds: string[];
}): Promise<boolean> {
  if (input.skillIds.length === 0) {
    return false;
  }

  if (input.skillIds.includes(RU_MARKET_QUALIFICATION_SKILL_ID)) {
    return true;
  }

  const rows = await db
    .select({ slug: skill.slug })
    .from(skill)
    .where(inArray(skill.id, input.skillIds));

  return rows.some((row) => row.slug === RU_MARKET_QUALIFICATION_SLUG);
}
