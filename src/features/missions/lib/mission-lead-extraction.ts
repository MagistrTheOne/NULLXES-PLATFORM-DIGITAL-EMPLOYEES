import type { MissionLeadItem } from "@/entities/employee-mission";
import type { MissionQualificationProfile } from "./resolve-mission-qualification-profile";
import { filterEnQualifiedMissionLeads } from "./qualify-en-mission-lead";
import { filterInvestorQualifiedMissionLeads } from "./qualify-investor-mission-lead";
import { filterRuQualifiedMissionLeads } from "./qualify-ru-mission-lead";
import { filterVerifiedMissionLeads } from "./verify-lead-contact";

const GENERIC_LEAD_SCHEMA_HINT = `{ "leads": [{ "companyName": "string", "domain": "string", "whyFit": "string", "budgetSignal": "string", "contactName": "string", "contactEmail": "string", "contactSourceUrl": "string", "proposalDraft": "string" }] }`;

const RU_LEAD_SCHEMA_HINT = `{ "leads": [{ "companyName": "string", "domain": "string", "isRussianCompany": true, "countryEvidence": "string", "sector": "string", "marketTenureYears": 0, "foundedYear": 0, "estimatedRevenueRub": "string", "revenueSourceUrl": "string", "whyFit": "string", "contactName": "string", "contactEmail": "string", "contactSourceUrl": "string", "agentPlan": "string", "proposalDraft": "string" }] }`;

const EN_LEAD_SCHEMA_HINT = `{ "leads": [{ "companyName": "string", "domain": "string", "countryCode": "string", "countryEvidence": "string", "sector": "string", "marketTenureYears": 0, "foundedYear": 0, "estimatedRevenueUsd": "string", "revenueSourceUrl": "string", "whyFit": "string", "contactName": "string", "contactEmail": "string", "contactSourceUrl": "string", "agentPlan": "string", "proposalDraft": "string" }] }`;

const INVESTOR_LEAD_SCHEMA_HINT = `{ "leads": [{ "companyName": "string", "domain": "string", "investorType": "string", "stageFocus": "string", "ticketSizeUsd": "string", "sectorFocus": "string", "portfolioFit": "string", "whyFit": "string", "contactName": "string", "contactEmail": "string", "contactSourceUrl": "string", "agentPlan": "string", "proposalDraft": "string" }] }`;

export function leadSchemaHintForProfile(
  profile: MissionQualificationProfile,
): string {
  switch (profile) {
    case "ru":
      return RU_LEAD_SCHEMA_HINT;
    case "en":
      return EN_LEAD_SCHEMA_HINT;
    case "investor":
      return INVESTOR_LEAD_SCHEMA_HINT;
    default:
      return GENERIC_LEAD_SCHEMA_HINT;
  }
}

export function buildLeadExtractionRules(
  language: "ru" | "en",
  profile: MissionQualificationProfile,
): string[] {
  if (profile === "ru") {
    return [
      "RU Market Qualification: only Russian companies with verified evidence.",
      "isRussianCompany=true only with explicit Russia signal in research; countryEvidence required.",
      "sector from research only. marketTenureYears/foundedYear from research or null.",
      "estimatedRevenueRub only if verbatim in research; revenueSourceUrl required when revenue set.",
      "contactEmail verbatim from research. No contact → skip company.",
      "agentPlan: 3–5 outreach steps. proposalDraft: short email from plan.",
      "Return up to 10 qualified leads.",
    ];
  }

  if (profile === "en") {
    return [
      "EN Market Qualification: US/UK/EU/international B2B only — exclude Russia (.ru, INN/OGRN).",
      "countryCode + countryEvidence from research. sector required.",
      "estimatedRevenueUsd only if verbatim in research; revenueSourceUrl when revenue set.",
      "contactEmail verbatim from research. No contact → skip company.",
      "agentPlan in English: 3–5 steps. proposalDraft: short outbound email.",
      "Return up to 10 qualified leads.",
    ];
  }

  if (profile === "investor") {
    return [
      "Investor base qualification: VC, angel, corporate VC, accelerator funds.",
      "companyName = fund name. investorType, stageFocus, sectorFocus from research.",
      "ticketSizeUsd only if verbatim in research. portfolioFit: why NULLXES fits.",
      "contactName = partner/analyst with published email verbatim from research.",
      "No verified contact → skip fund.",
      "agentPlan: pitch plan (angle, traction hook, ask, next step). proposalDraft: intro email.",
      "Return up to 10 qualified investors.",
    ];
  }

  if (language === "ru") {
    return [
      "Пиши proposalDraft только на русском.",
      "contactEmail — только если email дословно есть в research.",
      "Без подтверждённого email — не включай lead.",
      "Верни до 10 leads.",
    ];
  }

  return [
    "Write proposalDraft in English only.",
    "contactEmail only when verbatim in research.",
    "If no verified email, do not include the lead.",
    "Return up to 10 leads with verified contacts.",
  ];
}

export function requiredLeadFieldsHint(
  profile: MissionQualificationProfile,
): string {
  switch (profile) {
    case "ru":
      return "Every lead MUST include isRussianCompany=true, countryEvidence, sector, agentPlan, contactName, contactEmail, contactSourceUrl, proposalDraft.";
    case "en":
      return "Every lead MUST include countryCode, countryEvidence, sector, agentPlan, contactName, contactEmail, contactSourceUrl, proposalDraft.";
    case "investor":
      return "Every lead MUST include investorType, stageFocus, portfolioFit, agentPlan, contactName, contactEmail, contactSourceUrl, proposalDraft.";
    default:
      return "Every lead MUST include companyName, whyFit, proposalDraft, contactName, contactEmail, contactSourceUrl.";
  }
}

export function filterLeadsForProfile(
  profile: MissionQualificationProfile,
  leads: MissionLeadItem[],
  research: string,
): MissionLeadItem[] {
  switch (profile) {
    case "ru":
      return filterRuQualifiedMissionLeads(leads, research);
    case "en":
      return filterEnQualifiedMissionLeads(leads, research);
    case "investor":
      return filterInvestorQualifiedMissionLeads(leads, research);
    default:
      return filterVerifiedMissionLeads(leads, research);
  }
}

export function emptyLeadsErrorMessage(
  language: "ru" | "en",
  profile: MissionQualificationProfile,
): string {
  if (language === "ru") {
    switch (profile) {
      case "ru":
        return "Не найдено российских leads с подтверждёнными контактами, сектором и планом захода.";
      case "en":
        return "Не найдено международных EN leads с подтверждёнными контактами, сектором и планом.";
      case "investor":
        return "Не найдено инвесторов с подтверждёнными контактами и планом питча.";
      default:
        return "Не найдено leads с подтверждёнными B2B контактами из web research.";
    }
  }

  switch (profile) {
    case "ru":
      return "No Russian leads with verified contacts, sector, and agent plan found.";
    case "en":
      return "No EN market leads with verified contacts, sector, and agent plan found.";
    case "investor":
      return "No qualified investors with verified contacts and pitch plan found.";
    default:
      return "No leads with verified B2B contacts found in web research.";
  }
}
