export type TalkTurnSpanKey =
  | "debounce"
  | "brain_rtt"
  | "e2e"
  | "build"
  | "rag"
  | "ttfb"
  | "tool_loop";

export type TalkTurnSpans = Partial<Record<TalkTurnSpanKey, number>>;

export type TalkTurnFlags = {
  cacheHit?: boolean;
  ragUsed?: boolean;
  toolsUsed?: boolean;
};

export type TalkSessionMetricsSnapshot = {
  turnCount: number;
  p50E2eMs: number | null;
  p95E2eMs: number | null;
  avgBuildMs: number | null;
  avgRagMs: number | null;
  avgTtfbMs: number | null;
  lastTurn: {
    turnId: string;
    e2eMs: number | null;
    spans: TalkTurnSpans;
    flags: TalkTurnFlags;
    createdAt: string;
  } | null;
};

export type TalkSessionBrainCache = {
  v: 1;
  brainProvider: string;
  model: string;
  brainModelLabel: string;
  systemPromptBase: string;
  temperature: number;
  maxTokens: number;
  employeeName: string;
  employeeRole: string;
  enabledToolSlugs: string[];
};
