export type ScenarioSessionStatus =
  | "pending"
  | "in_talk"
  | "debrief_ready"
  | "completed"
  | "abandoned";

export type ScenarioDebriefObjective = {
  id: string;
  label: string;
  met: boolean;
  note?: string;
};

export type ScenarioDebrief = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  objectives: ScenarioDebriefObjective[];
  generatedAt: string;
};

export type ScenarioSessionMetrics = {
  startedAt?: string;
  talkEndedAt?: string;
  debriefViewedAt?: string;
  upgradeClickedAt?: string;
};
