import type { MissionLeadItem } from "@/entities/employee-mission";
import { isVerifiedLeadContact } from "./verify-lead-contact";
import {
  companyContextWindow,
  evidenceInResearch,
} from "./qualify-mission-lead-common";

const RUSSIA_MARKERS =
  /(?:росси[яи]|russia|российск|\.ru\b|инн\s*[:№]?\s*\d{10}|огрн\s*[:№]?\s*\d{13}|москва|санкт-петербург)/i;

function hasRussiaSignal(lead: MissionLeadItem, research: string): boolean {
  if (lead.countryEvidence?.trim() && evidenceInResearch(lead.countryEvidence, research)) {
    return RUSSIA_MARKERS.test(lead.countryEvidence);
  }

  const domain = lead.domain?.trim().toLowerCase() ?? "";
  if (domain.endsWith(".ru")) {
    return true;
  }

  const window = companyContextWindow(lead.companyName, research);
  if (!window) {
    return false;
  }

  return RUSSIA_MARKERS.test(window);
}

export function isRuQualifiedMissionLead(
  lead: MissionLeadItem,
  research: string,
): boolean {
  if (!isVerifiedLeadContact(lead, research)) {
    return false;
  }

  if (lead.isRussianCompany !== true) {
    return false;
  }

  if (!hasRussiaSignal(lead, research)) {
    return false;
  }

  if (!lead.sector?.trim()) {
    return false;
  }

  if (!lead.agentPlan?.trim()) {
    return false;
  }

  if (lead.estimatedRevenueRub?.trim() && lead.revenueSourceUrl?.trim()) {
    if (!evidenceInResearch(lead.estimatedRevenueRub, research)) {
      return false;
    }
  }

  return true;
}

export function filterRuQualifiedMissionLeads(
  leads: MissionLeadItem[],
  research: string,
): MissionLeadItem[] {
  return leads.filter((lead) => isRuQualifiedMissionLead(lead, research));
}
