import { getOpenAiApiBaseUrl, getOpenAiApiKey } from "@/shared/config/provider-env";
import type { MissionType } from "../lib/mission-type";
import {
  defaultMissionBrief,
  defaultMissionGoal,
  defaultMissionTitle,
} from "../lib/prospecting-defaults";
import {
  qualificationProfileForMissionType,
  skillSlugForProfile,
} from "../lib/mission-qualification-profile";

export type MissionComposeEmployee = {
  id: string;
  name: string;
  role: string;
};

export type MissionComposeSkill = {
  id: string;
  name: string;
  slug: string;
};

export type ComposedMissionDraft = {
  employeeId: string;
  type: MissionType;
  title: string;
  goal: string;
  brief: string;
  skillIds: string[];
  summaryBullets: string[];
};

const MISSION_TYPES: MissionType[] = [
  "prospecting",
  "prospecting_en",
  "investor_base",
  "custom",
];

function skillIdsForType(
  type: MissionType,
  library: MissionComposeSkill[],
): string[] {
  const profile = qualificationProfileForMissionType(type);
  if (profile === "generic") return [];
  const slug = skillSlugForProfile(profile);
  const skill = library.find((item) => item.slug === slug);
  return skill ? [skill.id] : [];
}

function heuristicType(intent: string): MissionType {
  const text = intent.toLowerCase();
  if (
    /investor|vc|фонд|инвест|ангел|seed|series|pitch/.test(text)
  ) {
    return "investor_base";
  }
  if (
    /us\b|uk\b|eu\b|europe|international|abroad|зарубеж|международ|usa|america/.test(
      text,
    )
  ) {
    return "prospecting_en";
  }
  if (
    /клиент|лид|проспект|b2b|продаж|рынок|рф|росс|компани/.test(text)
  ) {
    return "prospecting";
  }
  return "custom";
}

function heuristicDraft(input: {
  intent: string;
  employee: MissionComposeEmployee;
  library: MissionComposeSkill[];
}): ComposedMissionDraft {
  const employee = input.employee;
  const type = heuristicType(input.intent);
  const skillIds = skillIdsForType(type, input.library);
  const title =
    type === "custom"
      ? `${employee.name} · ${input.intent.trim().slice(0, 48)}`
      : defaultMissionTitle(employee.name, type);
  const goal =
    type === "custom"
      ? input.intent.trim().slice(0, 280)
      : defaultMissionGoal(type);
  const brief =
    type === "custom"
      ? input.intent.trim()
      : `${defaultMissionBrief(type)}\n\nКонтекст от руководителя:\n${input.intent.trim()}`;

  return {
    employeeId: employee.id,
    type,
    title,
    goal,
    brief,
    skillIds,
    summaryBullets: [
      `Сотрудник: ${employee.name}`,
      type === "custom"
        ? "Тип: своя задача"
        : type === "investor_base"
          ? "Тип: поиск инвесторов"
          : type === "prospecting_en"
            ? "Тип: клиенты за рубежом"
            : "Тип: клиенты в РФ",
      "Перед исходящими письмами — подтверждение человека",
    ],
  };
}

function parseType(raw: unknown): MissionType {
  if (typeof raw === "string" && MISSION_TYPES.includes(raw as MissionType)) {
    return raw as MissionType;
  }
  return "custom";
}

export async function composeMissionFromIntent(input: {
  intent: string;
  employees: MissionComposeEmployee[];
  skillLibrary: MissionComposeSkill[];
  preferredEmployeeId?: string;
}): Promise<ComposedMissionDraft> {
  const intent = input.intent.trim();
  if (!intent) {
    throw new Error("Describe the outcome you want.");
  }
  if (input.employees.length === 0) {
    throw new Error("No digital employees available.");
  }

  const preferred =
    input.employees.find((e) => e.id === input.preferredEmployeeId) ??
    input.employees[0];

  const fallback = heuristicDraft({
    intent,
    employee: preferred,
    library: input.skillLibrary,
  });

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return fallback;
  }

  const employeeCatalog = input.employees
    .map((e) => `- id=${e.id} · ${e.name} · ${e.role}`)
    .join("\n");
  const skillCatalog = input.skillLibrary
    .map((s) => `- id=${s.id} · slug=${s.slug} · ${s.name}`)
    .join("\n");

  try {
    const response = await fetch(`${getOpenAiApiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You compose a digital-employee mission for NULLXES Mission Control.
Return JSON only:
{
  "employeeId": string,
  "type": "prospecting"|"prospecting_en"|"investor_base"|"custom",
  "title": string,
  "goal": string,
  "brief": string,
  "skillIds": string[],
  "summaryBullets": string[]
}
Rules:
- Business language. No engineering jargon.
- Prefer prospecting for RU B2B leads, prospecting_en for foreign markets, investor_base for funds/VCs, custom otherwise.
- employeeId must be one of the provided employees (prefer preferredEmployeeId when set).
- skillIds must be subset of provided skill ids; for qualified types include the matching market skill when present.
- brief must be actionable steps for the employee (RU if intent is Russian, EN if English).
- summaryBullets: 3 short bullets for a CFO preview.
- title short; goal one sentence.`,
          },
          {
            role: "user",
            content: `Preferred employee id: ${preferred.id}
Employees:
${employeeCatalog}

Skills:
${skillCatalog || "(none)"}

Leader intent:
${intent}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return fallback;
    }

    const parsed = JSON.parse(content) as Partial<ComposedMissionDraft>;
    const employeeId =
      typeof parsed.employeeId === "string" &&
      input.employees.some((e) => e.id === parsed.employeeId)
        ? parsed.employeeId
        : preferred.id;
    const employee =
      input.employees.find((e) => e.id === employeeId) ?? preferred;
    const type = parseType(parsed.type);
    const libraryIds = new Set(input.skillLibrary.map((s) => s.id));
    const skillIdsFromModel = Array.isArray(parsed.skillIds)
      ? parsed.skillIds.filter(
          (id): id is string => typeof id === "string" && libraryIds.has(id),
        )
      : [];
    const skillIds =
      skillIdsFromModel.length > 0
        ? skillIdsFromModel
        : skillIdsForType(type, input.skillLibrary);

    const title =
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : defaultMissionTitle(employee.name, type);
    const goal =
      typeof parsed.goal === "string" && parsed.goal.trim()
        ? parsed.goal.trim()
        : defaultMissionGoal(type);
    const brief =
      typeof parsed.brief === "string" && parsed.brief.trim()
        ? parsed.brief.trim()
        : fallback.brief;
    const summaryBullets = Array.isArray(parsed.summaryBullets)
      ? parsed.summaryBullets
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 5)
      : fallback.summaryBullets;

    return {
      employeeId,
      type,
      title,
      goal,
      brief,
      skillIds,
      summaryBullets:
        summaryBullets.length > 0 ? summaryBullets : fallback.summaryBullets,
    };
  } catch {
    return fallback;
  }
}
