import {
  getOpenAiApiBaseUrl,
  getOpenAiApiKey,
} from "@/shared/config/provider-env";

export type EmployeeThoughtSeed = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  /** Derived floor activity badge key / label. */
  activity?: string | null;
  /** Active floor errand label, if any. */
  taskLabel?: string | null;
  /** Active mission title. */
  missionTitle?: string | null;
  /** Mission stage: research | draft | awaiting_approval | sent | … */
  missionStage?: string | null;
  /** Last mission action summary. */
  missionLastAction?: string | null;
};

export type EmployeeThoughtsMap = Record<string, string[]>;

type CacheEntry = { expires: number; map: EmployeeThoughtsMap };

// In-memory soft cache (per server instance). Avoids hammering the LLM on every
// mount; refresh bypasses it. Serverless instances each keep their own copy.
const cache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;
const MAX_EMPLOYEES = 24;
const THOUGHTS_MODEL = "gpt-4o-mini";

function sanitizeThoughts(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 72)
    .slice(0, 5);
}

/** Fingerprint so cache invalidates when roster context shifts. */
export function thoughtsContextFingerprint(
  employees: EmployeeThoughtSeed[],
): string {
  return employees
    .map(
      (employee) =>
        [
          employee.id,
          employee.status,
          employee.activity ?? "",
          employee.taskLabel ?? "",
          employee.missionStage ?? "",
          employee.missionTitle ?? "",
        ].join(":"),
    )
    .sort()
    .join("|");
}

/**
 * Generate short first-person speech lines per digital employee via OpenAI,
 * grounded in role / status / mission / task. One batched call for the roster,
 * cached with a TTL. Returns {} when no API key or on failure — callers show
 * no bubble (never fall back to curated simulation quotes).
 */
export async function generateEmployeeThoughts(input: {
  cacheKey: string;
  locale: string;
  employees: EmployeeThoughtSeed[];
  force?: boolean;
}): Promise<EmployeeThoughtsMap> {
  if (input.employees.length === 0) {
    return {};
  }
  if (!input.force) {
    const cached = cache.get(input.cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.map;
    }
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return {};
  }

  const roster = input.employees.slice(0, MAX_EMPLOYEES).map((employee) => ({
    id: employee.id,
    name: employee.name,
    role: employee.role,
    department: employee.department,
    status: employee.status,
    activity: employee.activity ?? null,
    taskLabel: employee.taskLabel ?? null,
    missionTitle: employee.missionTitle ?? null,
    missionStage: employee.missionStage ?? null,
    missionLastAction: employee.missionLastAction ?? null,
  }));

  const language = input.locale === "ru" ? "Russian" : "English";

  try {
    const response = await fetch(`${getOpenAiApiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: THOUGHTS_MODEL,
        temperature: 0.85,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You write short spoken lines for digital employees on an",
              "enterprise operations floor. These appear in speech bubbles.",
              "Tone: calm, professional, operational — like a focused colleague",
              "thinking out loud about their real work. First-person.",
              "Max 10 words each. No quotes. No memes. No fantasy lore.",
              "No 'Magistr', no roleplay catchphrases, no cozy lofi filler.",
              "Ground every line in the employee's role, status, activity,",
              "mission title/stage/lastAction, and task when present.",
              "Idle employees: quiet monitoring / readiness lines.",
              "Busy / mission-active: concrete work in progress.",
              `Write in ${language}.`,
              'Return JSON: { "items": [ { "id": "<copy id exactly>",',
              '"thoughts": ["...", "..."] } ] } with 4-5 thoughts each.',
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({ employees: roster }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return {};
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return {};
    }

    const parsed = JSON.parse(content) as {
      items?: Array<{ id?: string; thoughts?: unknown }>;
    };
    const validIds = new Set(roster.map((employee) => employee.id));
    const map: EmployeeThoughtsMap = {};
    for (const item of parsed.items ?? []) {
      if (!item?.id || !validIds.has(item.id)) {
        continue;
      }
      const thoughts = sanitizeThoughts(item.thoughts);
      if (thoughts.length > 0) {
        map[item.id] = thoughts;
      }
    }

    cache.set(input.cacheKey, { expires: Date.now() + TTL_MS, map });
    return map;
  } catch {
    return {};
  }
}
