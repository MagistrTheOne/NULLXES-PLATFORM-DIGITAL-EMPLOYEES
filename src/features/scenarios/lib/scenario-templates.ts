export type ScenarioTemplateObjective = {
  id: string;
  label: string;
};

export type ScenarioTemplate = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  userRole: string;
  setting: string;
  openingBeat: string;
  objectives: ScenarioTemplateObjective[];
  roleKeywords: string[];
  difficulty: "starter" | "standard" | "advanced";
};

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: "sales_cfo_pushback",
    titleKey: "salesCfoPushback.title",
    descriptionKey: "salesCfoPushback.description",
    userRole: "CFO evaluating a new vendor proposal",
    setting:
      "Quarterly budget review. The digital employee is pitching an enterprise automation platform.",
    openingBeat:
      "Open by questioning ROI, implementation risk, and why this cannot wait until next quarter.",
    objectives: [
      { id: "roi", label: "Address ROI with concrete business impact" },
      { id: "risk", label: "Respond to implementation risk concerns" },
      { id: "timeline", label: "Defend urgency without sounding pushy" },
    ],
    roleKeywords: ["sales", "enterprise", "account", "revenue", "business development"],
    difficulty: "standard",
  },
  {
    id: "support_escalation",
    titleKey: "supportEscalation.title",
    descriptionKey: "supportEscalation.description",
    userRole: "Frustrated enterprise customer on a live support call",
    setting:
      "A production outage affected billing for 40 minutes. The customer expects accountability.",
    openingBeat:
      "Start upset but professional. Demand status, root cause, and compensation options.",
    objectives: [
      { id: "empathy", label: "Acknowledge impact with empathy" },
      { id: "status", label: "Provide clear status and next steps" },
      { id: "resolution", label: "Offer a credible resolution path" },
    ],
    roleKeywords: ["support", "customer", "success", "service", "care"],
    difficulty: "starter",
  },
  {
    id: "legal_contract_review",
    titleKey: "legalContractReview.title",
    descriptionKey: "legalContractReview.description",
    userRole: "General counsel reviewing a vendor agreement",
    setting:
      "A 24-page SaaS agreement needs sign-off before procurement can proceed.",
    openingBeat:
      "Focus on liability caps, data processing terms, and termination clauses.",
    objectives: [
      { id: "liability", label: "Explain liability position clearly" },
      { id: "data", label: "Address data processing and security terms" },
      { id: "exit", label: "Clarify termination and transition rights" },
    ],
    roleKeywords: ["legal", "compliance", "counsel", "regulatory", "privacy"],
    difficulty: "advanced",
  },
  {
    id: "marketing_campaign_pitch",
    titleKey: "marketingCampaignPitch.title",
    descriptionKey: "marketingCampaignPitch.description",
    userRole: "CMO deciding whether to fund a campaign",
    setting:
      "The employee presents a Q3 demand-generation plan with limited budget headroom.",
    openingBeat:
      "Challenge channel mix, expected CAC, and how this ties to pipeline targets.",
    objectives: [
      { id: "strategy", label: "Connect campaign to measurable pipeline goals" },
      { id: "budget", label: "Justify spend against constrained budget" },
      { id: "metrics", label: "Define success metrics and reporting cadence" },
    ],
    roleKeywords: ["marketing", "growth", "brand", "content", "demand"],
    difficulty: "standard",
  },
  {
    id: "ops_incident_response",
    titleKey: "opsIncidentResponse.title",
    descriptionKey: "opsIncidentResponse.description",
    userRole: "Operations lead during an active incident bridge",
    setting:
      "Payment retries are failing across EU tenants. Leadership wants a 15-minute update.",
    openingBeat:
      "Ask for blast radius, mitigation status, customer comms, and ETA to recovery.",
    objectives: [
      { id: "scope", label: "State incident scope and customer impact" },
      { id: "mitigation", label: "Outline mitigation steps in progress" },
      { id: "comms", label: "Propose stakeholder communication plan" },
    ],
    roleKeywords: ["operations", "ops", "incident", "reliability", "sre"],
    difficulty: "standard",
  },
  {
    id: "analyst_exec_briefing",
    titleKey: "analystExecBriefing.title",
    descriptionKey: "analystExecBriefing.description",
    userRole: "Executive sponsor requesting a data briefing",
    setting:
      "Weekly leadership review. Churn rose 1.2 points and leadership wants answers fast.",
    openingBeat:
      "Ask for the headline insight, supporting evidence, and recommended actions.",
    objectives: [
      { id: "insight", label: "Lead with a clear executive insight" },
      { id: "evidence", label: "Support the insight with relevant data" },
      { id: "action", label: "Recommend prioritized next actions" },
    ],
    roleKeywords: ["analyst", "data", "analytics", "insights", "research"],
    difficulty: "starter",
  },
  {
    id: "automation_stakeholder_buyin",
    titleKey: "automationStakeholderBuyin.title",
    descriptionKey: "automationStakeholderBuyin.description",
    userRole: "Department head skeptical about automation rollout",
    setting:
      "A workflow automation pilot could eliminate 120 hours of manual work monthly.",
    openingBeat:
      "Question change management, integration risk, and whether the team is ready.",
    objectives: [
      { id: "value", label: "Quantify operational value credibly" },
      { id: "change", label: "Address change-management concerns" },
      { id: "pilot", label: "Propose a low-risk pilot scope" },
    ],
    roleKeywords: ["automation", "engineer", "workflow", "integration", "platform"],
    difficulty: "advanced",
  },
];

export function getScenarioTemplateById(
  templateId: string,
): ScenarioTemplate | undefined {
  return SCENARIO_TEMPLATES.find((template) => template.id === templateId);
}

export function rankScenarioTemplatesForRole(role: string): ScenarioTemplate[] {
  const normalized = role.trim().toLowerCase();
  if (!normalized) {
    return [...SCENARIO_TEMPLATES];
  }

  const scored = SCENARIO_TEMPLATES.map((template) => {
    const score = template.roleKeywords.reduce((total, keyword) => {
      return normalized.includes(keyword) ? total + 1 : total;
    }, 0);
    return { template, score };
  });

  scored.sort((left, right) => right.score - left.score);

  const matched = scored.filter((entry) => entry.score > 0).map((entry) => entry.template);
  if (matched.length > 0) {
    return matched;
  }

  return [...SCENARIO_TEMPLATES];
}

export function getRecommendedScenarioTemplate(role: string): ScenarioTemplate {
  return rankScenarioTemplatesForRole(role)[0] ?? SCENARIO_TEMPLATES[0]!;
}
