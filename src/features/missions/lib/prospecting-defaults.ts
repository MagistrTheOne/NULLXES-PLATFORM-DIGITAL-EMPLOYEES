import type { MissionType } from "./mission-type";
import { isQualifiedMissionType } from "./mission-type";

export function defaultProspectingBrief(): string {
  return defaultMissionBrief("prospecting");
}

export function defaultProspectingGoal(): string {
  return defaultMissionGoal("prospecting");
}

export function defaultProspectingTitle(employeeName: string): string {
  return defaultMissionTitle(employeeName, "prospecting");
}

export function defaultMissionBrief(type: MissionType): string {
  switch (type) {
    case "prospecting_en":
      return "Find US/UK/EU and international B2B companies for NULLXES Digital Employees. For each: verify country, sector, market tenure, revenue from sources only, real decision-maker contact. Skip without verified contact. Prepare agentPlan outreach from the digital employee.";
    case "investor_base":
      return "Build investor base: VC, angel, and corporate funds matching brief (stage, geo, sector). For each fund: verify investor type, stage focus, ticket size from sources, portfolio fit, and real partner contact with published email. Skip fund without contact. Prepare pitch agentPlan.";
    case "prospecting":
    default:
      return "Найти российские B2B компании для NULLXES Digital Employees. Для каждой: подтвердить РФ, сектор, стаж на рынке, выручку (только из источников), реальный контакт decision-maker. Без подтверждённого контакта — компанию не включать. Подготовить план захода от digital employee.";
  }
}

export function defaultMissionGoal(type: MissionType): string {
  switch (type) {
    case "prospecting_en":
      return "Qualify international EN-market enterprise prospects with verified contacts and outreach plans.";
    case "investor_base":
      return "Research and qualify investor targets with verified partner contacts and pitch plans.";
    case "prospecting":
    default:
      return "Квалифицировать российские enterprise-проспекты с подтверждёнными контактами и планом захода.";
  }
}

export function defaultMissionTitle(
  employeeName: string,
  type: MissionType,
): string {
  switch (type) {
    case "prospecting_en":
      return `${employeeName} · EN B2B prospecting`;
    case "investor_base":
      return `${employeeName} · Investor base`;
    case "prospecting":
    default:
      return `${employeeName} · RU B2B prospecting`;
  }
}

export function isProspectingMissionType(type: MissionType): boolean {
  return isQualifiedMissionType(type);
}
