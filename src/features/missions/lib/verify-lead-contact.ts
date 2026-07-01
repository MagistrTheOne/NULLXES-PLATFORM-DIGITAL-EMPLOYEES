import type { MissionLeadItem } from "@/entities/employee-mission";

const GENERIC_LOCAL_PART =
  /^(info|sales|enterprise|digital|ai|workplace|contact|hello|support|innovation|cloud|office|team|admin|marketing|hr|careers|press|media)(\+|\d|$)/i;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emailInResearch(email: string, research: string): boolean {
  const normalized = normalizeEmail(email);
  return research.toLowerCase().includes(normalized);
}

function looksLikeGenericInventedEmail(email: string): boolean {
  const local = email.split("@")[0] ?? "";
  return GENERIC_LOCAL_PART.test(local);
}

export function isVerifiedLeadContact(
  lead: MissionLeadItem,
  research: string,
): boolean {
  const email = lead.contactEmail?.trim();
  if (!email || !email.includes("@")) {
    return false;
  }

  if (!emailInResearch(email, research)) {
    return false;
  }

  if (looksLikeGenericInventedEmail(email) && !lead.contactSourceUrl?.trim()) {
    return false;
  }

  return true;
}

export function filterVerifiedMissionLeads(
  leads: MissionLeadItem[],
  research: string,
): MissionLeadItem[] {
  return leads.filter((lead) => isVerifiedLeadContact(lead, research));
}
