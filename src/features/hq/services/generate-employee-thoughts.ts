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
};

export type EmployeeThoughtsMap = Record<string, string[]>;

type CacheEntry = { expires: number; map: EmployeeThoughtsMap };

// In-memory soft cache (per server instance). Avoids hammering the LLM on every
// mount; refresh bypasses it. Serverless instances each keep their own copy,
// which is fine for ambient flavor.
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30 * 60 * 1000;
const MAX_EMPLOYEES = 24;
const THOUGHTS_MODEL = "gpt-4o-mini";

function sanitizeThoughts(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 48)
    .slice(0, 5);
}

/**
 * Generate short "lofi" inner thoughts per digital employee via OpenAI, aware
 * of role/department/status. One batched call for the whole roster, cached with
 * a TTL. Returns an empty map when no API key is set (callers fall back to the
 * curated pool), so this never throws into the UI.
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
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You write short, calm 'lofi' inner thoughts for digital office",
              "employees as they go about their day. Tone: cozy, professional,",
              "lightly human. Each thought is first-person, max 5 words, no",
              `quotes. Write in ${language}. Make them reflect the employee's`,
              "role, department and current status.",
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
