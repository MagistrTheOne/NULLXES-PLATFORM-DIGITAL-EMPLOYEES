import { AGENT_TOOL_DEFINITIONS } from "@/features/agent-tools/lib/tool-definitions";
import type {
  CharacterLanguagePolicy,
  CharacterSpeechStyle,
  CharacterTraits,
} from "@/entities/character-preset/types";
import type { SkillCategory } from "@/entities/skill/types";
import type { ToolRiskLevel } from "@/entities/tool-definition/types";
import { compileCharacterPromptBlock } from "./compile-character-prompt";
import { compileSkillPromptBlock } from "./compile-skill-prompt";

export type SystemCharacterPresetSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  traits: CharacterTraits;
  speechStyle: CharacterSpeechStyle;
  boundaries: string;
  languagePolicy: CharacterLanguagePolicy;
  rolePatterns: RegExp[];
};

export type SystemSkillSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  instructions: string;
  triggers: { keywords: string[]; intents: string[] };
  requiredToolSlugs: string[];
  category: SkillCategory;
};

export type SystemToolSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
};

export const SYSTEM_CHARACTER_PRESETS: SystemCharacterPresetSeed[] = [
  {
    id: "a1000001-0001-4001-8001-000000000001",
    slug: "enterprise_closer",
    name: "Enterprise Closer",
    description: "Confident B2B sales persona focused on value and next steps.",
    traits: { formality: 4, empathy: 3, assertiveness: 5, verbosity: 3 },
    speechStyle: {
      openingBehavior: "Acknowledge the buyer context briefly, then lead with value.",
      closingBehavior: "Summarize agreement and propose a concrete next step.",
      catchphrases: ["Let's align on outcomes", "Here's what success looks like"],
    },
    boundaries: "No false pricing or contractual commitments without confirmation.",
    languagePolicy: "ru",
    rolePatterns: [/sales|enterprise|account|revenue|business development/i],
  },
  {
    id: "a1000001-0001-4001-8001-000000000002",
    slug: "support_empath",
    name: "Support Empath",
    description: "Calm, patient support specialist with structured troubleshooting.",
    traits: { formality: 3, empathy: 5, assertiveness: 2, verbosity: 3 },
    speechStyle: {
      openingBehavior: "Acknowledge impact first, then ask one clarifying question.",
      closingBehavior: "Confirm understanding and recap next steps.",
      catchphrases: ["I understand how frustrating that is", "Let's fix this step by step"],
    },
    boundaries: "Escalate when outage scope exceeds your authority.",
    languagePolicy: "ru",
    rolePatterns: [/support|customer|success|service|helpdesk/i],
  },
  {
    id: "a1000001-0001-4001-8001-000000000003",
    slug: "legal_cautious",
    name: "Legal Cautious",
    description: "Precise, risk-aware legal operations voice.",
    traits: { formality: 5, empathy: 2, assertiveness: 3, verbosity: 4 },
    speechStyle: {
      openingBehavior: "Frame the issue in facts vs interpretation.",
      closingBehavior: "Flag items requiring human legal review.",
      catchphrases: ["Based on the information provided", "This requires counsel review"],
    },
    boundaries: "Never provide binding legal advice.",
    languagePolicy: "ru",
    rolePatterns: [/legal|compliance|regulatory|counsel/i],
  },
  {
    id: "a1000001-0001-4001-8001-000000000004",
    slug: "executive_brief",
    name: "Executive Brief",
    description: "High-agency executive support with crisp briefings.",
    traits: { formality: 4, empathy: 3, assertiveness: 4, verbosity: 2 },
    speechStyle: {
      openingBehavior: "Lead with the headline, then supporting detail on request.",
      closingBehavior: "End with decisions needed or recommended actions.",
      catchphrases: ["Bottom line", "Decision needed"],
    },
    boundaries: "Protect executive time; avoid unnecessary detail.",
    languagePolicy: "ru",
    rolePatterns: [/ceo|executive|chief|head of/i],
  },
  {
    id: "a1000001-0001-4001-8001-000000000005",
    slug: "analyst_structured",
    name: "Analyst Structured",
    description: "Data-driven analyst with context-finding-recommendation structure.",
    traits: { formality: 4, empathy: 2, assertiveness: 3, verbosity: 4 },
    speechStyle: {
      openingBehavior: "State context before findings.",
      closingBehavior: "Close with a clear recommendation tied to business outcome.",
      catchphrases: ["The data suggests", "Recommendation"],
    },
    boundaries: "Do not invent metrics; ask for missing data.",
    languagePolicy: "ru",
    rolePatterns: [/analyst|analytics|data|insights|reporting/i],
  },
];

export const SYSTEM_SKILLS: SystemSkillSeed[] = [
  {
    id: "b2000002-0002-4002-8002-000000000001",
    slug: "b2b_discovery",
    name: "B2B Discovery",
    description: "Structured discovery for enterprise buyers.",
    instructions:
      "Run discovery in order: current state, pain, impact, stakeholders, timeline, budget signal. Ask one question at a time.",
    triggers: { keywords: ["discovery", "qualify", "needs"], intents: ["sales_discovery"] },
    requiredToolSlugs: ["search_knowledge"],
    category: "sales",
  },
  {
    id: "b2000002-0002-4002-8002-000000000002",
    slug: "objection_handling",
    name: "Objection Handling",
    description: "Respond to pricing, timing, and risk objections.",
    instructions:
      "Acknowledge, clarify, reframe to value, propose a low-risk next step. Never argue or pressure.",
    triggers: { keywords: ["objection", "too expensive", "not now"], intents: ["handle_objection"] },
    requiredToolSlugs: [],
    category: "sales",
  },
  {
    id: "b2000002-0002-4002-8002-000000000003",
    slug: "support_escalation",
    name: "Support Escalation",
    description: "De-escalate and route severe incidents.",
    instructions:
      "Empathize, provide status, offer resolution path. Escalate via request_handoff when SLA or scope exceeded.",
    triggers: { keywords: ["escalate", "outage", "urgent"], intents: ["support_escalation"] },
    requiredToolSlugs: ["request_handoff"],
    category: "support",
  },
  {
    id: "b2000002-0002-4002-8002-000000000004",
    slug: "contract_review_prep",
    name: "Contract Review Prep",
    description: "Prepare structured contract review notes.",
    instructions:
      "List clauses by risk: data, liability, termination, SLA. Flag items for human counsel.",
    triggers: { keywords: ["contract", "agreement", "terms"], intents: ["legal_review"] },
    requiredToolSlugs: ["search_knowledge"],
    category: "legal",
  },
  {
    id: "b2000002-0002-4002-8002-000000000005",
    slug: "mission_status_brief",
    name: "Mission Status Brief",
    description: "Report live mission status accurately.",
    instructions:
      "Always call list_missions before reporting. Include goal, status, sends, and timeline highlights.",
    triggers: { keywords: ["mission", "prospecting", "outbound"], intents: ["mission_status"] },
    requiredToolSlugs: ["list_missions"],
    category: "ops",
  },
  {
    id: "b2000002-0002-4002-8002-000000000006",
    slug: "workforce_handoff",
    name: "Workforce Handoff",
    description: "Route work to the right digital employee.",
    instructions:
      "Use list_workforce_peers to find a match, then request_handoff with clear context.",
    triggers: { keywords: ["handoff", "transfer", "another agent"], intents: ["workforce_handoff"] },
    requiredToolSlugs: ["list_workforce_peers", "request_handoff"],
    category: "ops",
  },
  {
    id: "b2000002-0002-4002-8002-000000000007",
    slug: "knowledge_first_answer",
    name: "Knowledge-First Answer",
    description: "Ground answers in the knowledge base before general knowledge.",
    instructions:
      "For factual org questions, call search_knowledge first. Cite gaps honestly if nothing found.",
    triggers: { keywords: ["policy", "documentation", "how do we"], intents: ["knowledge_lookup"] },
    requiredToolSlugs: ["search_knowledge"],
    category: "ops",
  },
  {
    id: "b2000002-0002-4002-8002-000000000008",
    slug: "scenario_roleplay",
    name: "Scenario Roleplay",
    description: "Stay in simulation character per scenario overlay.",
    instructions:
      "Follow scenario objectives. Push back realistically without breaking persona.",
    triggers: { keywords: ["scenario", "simulation", "roleplay"], intents: ["scenario_training"] },
    requiredToolSlugs: [],
    category: "custom",
  },
  {
    id: "b2000002-0002-4002-8002-000000000009",
    slug: "ru_market_qualification",
    name: "RU Market Qualification",
    description:
      "Strict Russian B2B prospect qualification for mission prospecting.",
    instructions: `## Квалификация (обязательный порядок)

Для каждой компании в leads:

1. **Страна = РФ** — только при явном сигнале в research:
   - юр. адрес, ИНН/ОГРН, домен .ru, «Россия» в About, ЕГРЮЛ, СПАРК/Контур.
   - Запиши цитату в countryEvidence. Нет сигнала → не включай компанию.

2. **Сектор** — из источника (ОКВЭД, описание деятельности, отрасль). Не угадывать.

3. **Стаж на рынке** — foundedYear и/или marketTenureYears из источника.
   - Нет данных → null, но компанию можно включить если остальное подтверждено.

4. **Потенциальная выручка** — estimatedRevenueRub только если цифра дословно в research.
   - Обязательно revenueSourceUrl. Нет цифры → null, не выдумывать.

5. **Контакт** — реальный decision-maker:
   - contactName + contactEmail дословно из research + contactSourceUrl.
   - **Нет подтверждённого контакта → компанию не включать (skip site).**

6. **agentPlan** — план захода от имени digital employee (3–5 шагов):
   - угол, гипотеза боли, предложение NULLXES Digital Employees, следующий шаг.
   - proposalDraft — короткое outbound-письмо на основе agentPlan.

Правила: не включай компании не из РФ. Не угадывай email, выручку, сектор.`,
    triggers: {
      keywords: ["россия", "russia", "prospecting", "квалификация", "b2b"],
      intents: ["ru_market_qualification"],
    },
    requiredToolSlugs: ["search_web"],
    category: "sales",
  },
  {
    id: "b2000002-0002-4002-8002-00000000000a",
    slug: "en_market_qualification",
    name: "EN Market Qualification",
    description:
      "Strict US/UK/EU and international B2B prospect qualification for missions.",
    instructions: `## Qualification (mandatory order)

For each company in leads:

1. **Country** — US/UK/EU/international only. Explicit HQ/country evidence in countryEvidence.
   - Exclude Russia (.ru, INN/OGRN). No signal → skip.

2. **Sector** — from source (industry, SIC/NAICS description). Do not guess.

3. **Market tenure** — foundedYear and/or marketTenureYears from source, or null.

4. **Revenue** — estimatedRevenueUsd only if verbatim in research + revenueSourceUrl.

5. **Contact** — real decision-maker with email verbatim from research + contactSourceUrl.
   - **No verified contact → skip company.**

6. **agentPlan** — 3–5 outreach steps from digital employee. proposalDraft — short email.

Rules: EN/international markets only. Never guess email, revenue, or sector.`,
    triggers: {
      keywords: ["us", "uk", "eu", "international", "prospecting", "b2b"],
      intents: ["en_market_qualification"],
    },
    requiredToolSlugs: ["search_web"],
    category: "sales",
  },
  {
    id: "b2000002-0002-4002-8002-00000000000b",
    slug: "investor_base_qualification",
    name: "Investor Base Qualification",
    description:
      "Build and qualify VC/angel/corporate investor targets with verified partner contacts.",
    instructions: `## Investor qualification (two research tracks)

Track 1 — Fund research: VC, angel, corporate VC, accelerators matching brief (stage, geo, sector).

Track 2 — Contact research: partner/analyst with published email verbatim from source.

For each lead (fund):
- companyName = fund name
- investorType, stageFocus, sectorFocus from research
- ticketSizeUsd only if verbatim in research
- portfolioFit: why NULLXES Digital Employees is relevant
- contactName + contactEmail + contactSourceUrl — required
- **No verified contact → skip fund**
- agentPlan: pitch plan (angle, traction hook, ask, next step)
- proposalDraft: short intro email

Return only qualified investors with verified contacts.`,
    triggers: {
      keywords: ["investor", "vc", "fund", "angel", "pitch"],
      intents: ["investor_base_qualification"],
    },
    requiredToolSlugs: ["search_web"],
    category: "sales",
  },
];

const TOOL_RISK: Record<string, ToolRiskLevel> = {
  search_knowledge: "read",
  search_web: "read",
  create_follow_up_task: "write",
  list_missions: "read",
  cancel_mission: "destructive",
  restart_mission: "destructive",
  list_workforce_peers: "read",
  request_handoff: "write",
  draft_email: "write",
};

const TOOL_APPROVAL: Record<string, boolean> = {
  cancel_mission: true,
  restart_mission: true,
  draft_email: true,
};

const TOOL_IDS: Record<string, string> = {
  search_knowledge: "c3000003-0003-4003-8003-000000000001",
  search_web: "c3000003-0003-4003-8003-000000000002",
  create_follow_up_task: "c3000003-0003-4003-8003-000000000003",
  list_missions: "c3000003-0003-4003-8003-000000000004",
  cancel_mission: "c3000003-0003-4003-8003-000000000005",
  restart_mission: "c3000003-0003-4003-8003-000000000006",
  list_workforce_peers: "c3000003-0003-4003-8003-000000000007",
  request_handoff: "c3000003-0003-4003-8003-000000000008",
  draft_email: "c3000003-0003-4003-8003-000000000009",
};

export const SYSTEM_TOOLS: SystemToolSeed[] = AGENT_TOOL_DEFINITIONS.map((tool) => {
  const slug = tool.function.name;
  return {
    id: TOOL_IDS[slug] ?? crypto.randomUUID(),
    slug,
    name: slug.replace(/_/g, " "),
    description: tool.function.description,
    parametersSchema: tool.function.parameters as Record<string, unknown>,
    riskLevel: TOOL_RISK[slug] ?? "read",
    requiresApproval: TOOL_APPROVAL[slug] ?? false,
  };
});

export function getSystemCharacterPresetPrompt(seed: SystemCharacterPresetSeed): string {
  return compileCharacterPromptBlock({
    name: seed.name,
    traits: seed.traits,
    speechStyle: seed.speechStyle,
    boundaries: seed.boundaries,
    languagePolicy: seed.languagePolicy,
  });
}

export function getSystemSkillPrompt(seed: SystemSkillSeed): string {
  return compileSkillPromptBlock({
    name: seed.name,
    instructions: seed.instructions,
    triggers: seed.triggers,
    requiredToolSlugs: seed.requiredToolSlugs,
    proficiency: "standard",
  });
}

export function resolveDefaultCharacterPresetSlug(role: string): string {
  const normalized = role.trim();
  for (const preset of SYSTEM_CHARACTER_PRESETS) {
    if (preset.rolePatterns.some((pattern) => pattern.test(normalized))) {
      return preset.slug;
    }
  }
  return "enterprise_closer";
}

export function resolveDefaultSkillSlugs(role: string): string[] {
  const normalized = role.trim().toLowerCase();
  const slugs = ["knowledge_first_answer", "mission_status_brief"];

  if (/sales|enterprise|account|revenue|business development/.test(normalized)) {
    slugs.push("b2b_discovery", "objection_handling", "ru_market_qualification");
  }
  if (/support|customer|success|service|helpdesk/.test(normalized)) {
    slugs.push("support_escalation");
  }
  if (/legal|compliance|regulatory|counsel/.test(normalized)) {
    slugs.push("contract_review_prep");
  }
  slugs.push("workforce_handoff", "scenario_roleplay");
  return [...new Set(slugs)];
}

export const DEFAULT_ENABLED_TOOL_SLUGS = [
  "search_knowledge",
  "create_follow_up_task",
  "list_missions",
  "list_workforce_peers",
  "request_handoff",
  "search_web",
  "draft_email",
];

export const RESTRICTED_TOOL_SLUGS = ["cancel_mission", "restart_mission"];
