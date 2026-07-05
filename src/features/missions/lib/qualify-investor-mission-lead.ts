import type { MissionLeadItem } from "@/entities/employee-mission";
import { isVerifiedLeadContact } from "./verify-lead-contact";
import { evidenceInResearch } from "./qualify-mission-lead-common";

export function isInvestorQualifiedMissionLead(
  lead: MissionLeadItem,
  research: string,
): boolean {
  if (!isVerifiedLeadContact(lead, research)) {
    return false;
  }

  if (!lead.investorType?.trim()) {
    return false;
  }

  if (!lead.stageFocus?.trim()) {
    return false;
  }

  if (!lead.portfolioFit?.trim()) {
    return false;
  }

  if (!lead.agentPlan?.trim()) {
    return false;
  }

  const ticket = lead.ticketSizeUsd?.trim();
  if (ticket && !evidenceInResearch(ticket, research)) {
    return false;
  }

  return true;
}

export function filterInvestorQualifiedMissionLeads(
  leads: MissionLeadItem[],
  research: string,
): MissionLeadItem[] {
  return leads.filter((lead) => isInvestorQualifiedMissionLead(lead, research));
}
