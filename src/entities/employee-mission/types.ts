export type MissionEvidenceItem = {
  source: string;
  url?: string;
  snippet: string;
};

export type MissionLeadItem = {
  companyName: string;
  domain?: string;
  whyFit: string;
  budgetSignal?: string;
  contactHypothesis?: string;
  contactEmail?: string;
  proposalDraft: string;
  sentAt?: string;
  sendError?: string;
};

export type MissionTimelineStep = {
  key: string;
  label: string;
  at: string;
};
