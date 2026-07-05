import type { MissionLeadItem } from "@/entities/employee-mission";
import { isVerifiedLeadContact } from "./verify-lead-contact";
import {
  companyContextWindow,
  evidenceInResearch,
} from "./qualify-mission-lead-common";

const EN_MARKERS =
  /(?:united states|u\.?s\.?a?\.?|united kingdom|u\.?k\.?|germany|france|canada|australia|singapore|ireland|netherlands|inc\.|llc|ltd\.|plc|gmbh|s\.?a\.?|headquarters|hq)/i;

const RUSSIA_MARKERS = /(?:росси[яи]|russia|\.ru\b|инн|огрн)/i;

function hasEnMarketSignal(lead: MissionLeadItem, research: string): boolean {
  if (lead.countryEvidence?.trim() && evidenceInResearch(lead.countryEvidence, research)) {
    if (RUSSIA_MARKERS.test(lead.countryEvidence)) {
      return false;
    }
    return EN_MARKERS.test(lead.countryEvidence) || Boolean(lead.countryCode?.trim());
  }

  const domain = lead.domain?.trim().toLowerCase() ?? "";
  if (domain.endsWith(".ru")) {
    return false;
  }

  const window = companyContextWindow(lead.companyName, research);
  if (!window) {
    return Boolean(lead.countryCode?.trim() && lead.countryCode !== "RU");
  }

  if (RUSSIA_MARKERS.test(window)) {
    return false;
  }

  return EN_MARKERS.test(window) || Boolean(lead.countryCode?.trim() && lead.countryCode !== "RU");
}

export function isEnQualifiedMissionLead(
  lead: MissionLeadItem,
  research: string,
): boolean {
  if (!isVerifiedLeadContact(lead, research)) {
    return false;
  }

  if (!hasEnMarketSignal(lead, research)) {
    return false;
  }

  if (!lead.sector?.trim()) {
    return false;
  }

  if (!lead.agentPlan?.trim()) {
    return false;
  }

  const revenue = lead.estimatedRevenueUsd?.trim();
  if (revenue && lead.revenueSourceUrl?.trim()) {
    if (!evidenceInResearch(revenue, research)) {
      return false;
    }
  }

  return true;
}

export function filterEnQualifiedMissionLeads(
  leads: MissionLeadItem[],
  research: string,
): MissionLeadItem[] {
  return leads.filter((lead) => isEnQualifiedMissionLead(lead, research));
}
