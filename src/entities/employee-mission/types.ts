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
  proposalDraft: string;
};

export type MissionTimelineStep = {
  key: string;
  label: string;
  at: string;
};
