import type { HqTaskDestination } from "@/entities/hq-task";

export type ParsedHqCommand = {
  destination: HqTaskDestination;
  /** The destination alias the user actually wrote, e.g. "CRM". */
  matchedTerm: string;
};

/** Chat-derived floor intent (movement is decided by HQBehaviorPlanner). */
export type HqChatIntent = {
  kind: "navigate";
  destination: HqTaskDestination;
  matchedTerm: string;
};

/**
 * Movement verbs (ru/en) that signal a floor errand. We require one of these so
 * normal conversation that merely mentions "sales" or "analytics" does not
 * accidentally send the employee walking.
 */
const MOVE_VERBS = [
  "сходи",
  "иди",
  "идти",
  "отправляйся",
  "отправься",
  "загляни",
  "посети",
  "дуй",
  "беги",
  "go to",
  "go",
  "walk to",
  "walk",
  "head to",
  "head over",
  "navigate to",
  "visit",
];

/**
 * Destination aliases. Order matters only for the reported `matchedTerm`; the
 * resolved destination maps onto an HQ department room.
 */
const DESTINATION_ALIASES: Array<{
  destination: HqTaskDestination;
  terms: string[];
}> = [
  {
    destination: "sales",
    terms: ["crm", "срм", "сделк", "воронк", "лид", "sales", "продаж", "pipeline"],
  },
  {
    destination: "support",
    terms: ["support", "поддержк", "саппорт", "helpdesk", "тикет", "ticket"],
  },
  {
    destination: "hr",
    terms: ["hr", "эйчар", "кадр", "recruit", "персонал", "people"],
  },
  {
    destination: "analytics",
    terms: ["analytic", "аналитик", "данны", "data", "отчет", "отчёт", "report", "bi", "дашборд", "dashboard"],
  },
  {
    destination: "executive",
    terms: ["executive", "exec", "руководств", "директор", "boardroom", "совет", "ceo"],
  },
  {
    destination: "reception",
    terms: ["reception", "ресепшн", "ресепшен", "приемн", "приёмн", "front desk", "lobby", "холл"],
  },
];

/**
 * Parse chat text into a semantic HQ intent. Returns null for normal conversation.
 * Persisted as `hq_task`; the behavior planner maps navigate → walk_path.
 */
export function parseHqIntent(input: string): HqChatIntent | null {
  const command = parseHqCommand(input);
  if (!command) {
    return null;
  }
  return { kind: "navigate", ...command };
}

/**
 * Parse a free-text agent-chat message into a floor errand, or null when it is
 * not a navigation command. Prefer `parseHqIntent` at integration boundaries.
 */
export function parseHqCommand(input: string): ParsedHqCommand | null {
  const text = input.trim().toLowerCase();
  if (text.length === 0 || text.length > 240) {
    return null;
  }

  const hasVerb = MOVE_VERBS.some((verb) => text.includes(verb));
  if (!hasVerb) {
    return null;
  }

  for (const { destination, terms } of DESTINATION_ALIASES) {
    const matched = terms.find((term) => text.includes(term));
    if (matched) {
      return { destination, matchedTerm: matched };
    }
  }

  return null;
}
