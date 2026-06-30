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

export type MissionHandoffItem = {
  handoffId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  toEmployeeName: string;
  role: string;
  stage: string;
  taskId?: string;
  status: "pending" | "working" | "completed" | "skipped";
  summary?: string;
  completedAt?: string;
};

export type MissionSource = "manual" | "scheduled";
