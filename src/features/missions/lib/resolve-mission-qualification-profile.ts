import "server-only";

import { inArray } from "drizzle-orm";
import { skill } from "@/entities/skill/schema";
import { db } from "@/shared/db/client";
import type { MissionType } from "./mission-type";
import {
  qualificationProfileForMissionType,
  resolveMissionQualificationProfileFromSkillIds,
  resolveMissionQualificationProfileFromSkillSlugs,
  type MissionQualificationProfile,
} from "./mission-qualification-profile";

export type { MissionQualificationProfile } from "./mission-qualification-profile";
export {
  EN_MARKET_QUALIFICATION_SKILL_ID,
  EN_MARKET_QUALIFICATION_SLUG,
  EN_PROSPECTING_PLAN,
  INVESTOR_BASE_PLAN,
  INVESTOR_BASE_QUALIFICATION_SKILL_ID,
  INVESTOR_BASE_QUALIFICATION_SLUG,
  RU_MARKET_QUALIFICATION_SKILL_ID,
  RU_MARKET_QUALIFICATION_SLUG,
  RU_PROSPECTING_PLAN,
  prospectingPlanForProfile,
  qualificationProfileForMissionType,
  skillIdForProfile,
  skillSlugForProfile,
} from "./mission-qualification-profile";

export async function resolveMissionQualificationProfile(input: {
  organizationId: string;
  missionType: MissionType;
  skillIds: string[];
}): Promise<MissionQualificationProfile> {
  const typeProfile = qualificationProfileForMissionType(input.missionType);
  if (typeProfile !== "generic") {
    return typeProfile;
  }

  const fromIds = resolveMissionQualificationProfileFromSkillIds(input.skillIds);
  if (fromIds !== "generic") {
    return fromIds;
  }

  if (input.skillIds.length === 0) {
    return "generic";
  }

  const rows = await db
    .select({ slug: skill.slug })
    .from(skill)
    .where(inArray(skill.id, input.skillIds));

  return resolveMissionQualificationProfileFromSkillSlugs(
    rows.map((row) => row.slug),
  );
}
