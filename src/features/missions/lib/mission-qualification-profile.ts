import type { MissionType } from "./mission-type";

export type MissionQualificationProfile =
  | "ru"
  | "en"
  | "investor"
  | "generic";

export const RU_MARKET_QUALIFICATION_SLUG = "ru_market_qualification";
export const EN_MARKET_QUALIFICATION_SLUG = "en_market_qualification";
export const INVESTOR_BASE_QUALIFICATION_SLUG = "investor_base_qualification";

export const RU_MARKET_QUALIFICATION_SKILL_ID =
  "b2000002-0002-4002-8002-000000000009";
export const EN_MARKET_QUALIFICATION_SKILL_ID =
  "b2000002-0002-4002-8002-00000000000a";
export const INVESTOR_BASE_QUALIFICATION_SKILL_ID =
  "b2000002-0002-4002-8002-00000000000b";

export const RU_PROSPECTING_PLAN = `1. Web research: российские B2B компании по brief.
2. Квалификация: страна РФ (с evidence), сектор, стаж на рынке, выручка только из источников.
3. Контакт: реальный decision-maker с email дословно из research — без контакта компанию пропустить.
4. План захода (agentPlan) от digital employee на каждую qualified компанию.
5. Digest CEO + approval перед outbound.`;

export const EN_PROSPECTING_PLAN = `1. Web research: US/UK/EU and international B2B companies per brief.
2. Qualify: country (with evidence), sector, market tenure, revenue from sources only.
3. Contact: verified decision-maker email verbatim from research — skip company without contact.
4. agentPlan outreach steps per qualified company.
5. CEO digest + approval before outbound.`;

export const INVESTOR_BASE_PLAN = `1. Research: VC/angel/corporate funds matching brief (stage, geo, sector).
2. Research: partner/analyst contacts with published emails.
3. Qualify: fund fit, ticket size from sources, portfolio alignment — skip without verified contact.
4. agentPlan pitch plan per qualified investor.
5. CEO digest + approval before outreach.`;

const PROFILE_SKILL_SLUG: Record<
  Exclude<MissionQualificationProfile, "generic">,
  string
> = {
  ru: RU_MARKET_QUALIFICATION_SLUG,
  en: EN_MARKET_QUALIFICATION_SLUG,
  investor: INVESTOR_BASE_QUALIFICATION_SLUG,
};

const PROFILE_SKILL_ID: Record<
  Exclude<MissionQualificationProfile, "generic">,
  string
> = {
  ru: RU_MARKET_QUALIFICATION_SKILL_ID,
  en: EN_MARKET_QUALIFICATION_SKILL_ID,
  investor: INVESTOR_BASE_QUALIFICATION_SKILL_ID,
};

const TYPE_PROFILE: Partial<Record<MissionType, MissionQualificationProfile>> = {
  prospecting: "ru",
  prospecting_en: "en",
  investor_base: "investor",
};

export function qualificationProfileForMissionType(
  type: MissionType,
): MissionQualificationProfile {
  return TYPE_PROFILE[type] ?? "generic";
}

export function skillSlugForProfile(
  profile: Exclude<MissionQualificationProfile, "generic">,
): string {
  return PROFILE_SKILL_SLUG[profile];
}

export function skillIdForProfile(
  profile: Exclude<MissionQualificationProfile, "generic">,
): string {
  return PROFILE_SKILL_ID[profile];
}

export function prospectingPlanForProfile(
  profile: MissionQualificationProfile,
): string | null {
  switch (profile) {
    case "ru":
      return RU_PROSPECTING_PLAN;
    case "en":
      return EN_PROSPECTING_PLAN;
    case "investor":
      return INVESTOR_BASE_PLAN;
    default:
      return null;
  }
}

export function resolveMissionQualificationProfileFromSkillIds(
  skillIds: string[],
): MissionQualificationProfile {
  if (skillIds.length === 0) {
    return "generic";
  }

  if (skillIds.includes(INVESTOR_BASE_QUALIFICATION_SKILL_ID)) {
    return "investor";
  }
  if (skillIds.includes(EN_MARKET_QUALIFICATION_SKILL_ID)) {
    return "en";
  }
  if (skillIds.includes(RU_MARKET_QUALIFICATION_SKILL_ID)) {
    return "ru";
  }

  return "generic";
}

export function resolveMissionQualificationProfileFromSkillSlugs(
  slugs: Iterable<string>,
): MissionQualificationProfile {
  const slugSet = new Set(slugs);
  if (slugSet.has(INVESTOR_BASE_QUALIFICATION_SLUG)) {
    return "investor";
  }
  if (slugSet.has(EN_MARKET_QUALIFICATION_SLUG)) {
    return "en";
  }
  if (slugSet.has(RU_MARKET_QUALIFICATION_SLUG)) {
    return "ru";
  }
  return "generic";
}
