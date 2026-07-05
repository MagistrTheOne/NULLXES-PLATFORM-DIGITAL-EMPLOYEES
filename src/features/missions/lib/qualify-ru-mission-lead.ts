import type { MissionLeadItem } from "@/entities/employee-mission";
import { isVerifiedLeadContact } from "./verify-lead-contact";

const RUSSIA_MARKERS =
  /(?:росси[яи]|russia|российск|\.ru\b|инн\s*[:№]?\s*\d{10}|огрн\s*[:№]?\s*\d{13}|москва|санкт-петербург)/i;

function evidenceInResearch(text: string | undefined, research: string): boolean {
  const snippet = text?.trim();
  if (!snippet) {
    return false;
  }

  return research.toLowerCase().includes(snippet.toLowerCase());
}

function hasRussiaSignal(lead: MissionLeadItem, research: string): boolean {
  if (lead.countryEvidence?.trim() && evidenceInResearch(lead.countryEvidence, research)) {
    return RUSSIA_MARKERS.test(lead.countryEvidence);
  }

  const domain = lead.domain?.trim().toLowerCase() ?? "";
  if (domain.endsWith(".ru")) {
    return true;
  }

  const company = lead.companyName.trim();
  if (!company) {
    return false;
  }

  const index = research.toLowerCase().indexOf(company.toLowerCase());
  if (index === -1) {
    return false;
  }

  const window = research.slice(Math.max(0, index - 200), index + 400);
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
