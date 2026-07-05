import { and, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import {
  employeeMission,
  type MissionEvidenceItem,
  type MissionLeadItem,
} from "@/entities/employee-mission";
import { buildTalkBrainRequest } from "@/features/runtime-session/services/build-talk-brain-request";
import { collectTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";
import { recordWorkEvent } from "@/features/work-event";
import { appendMissionTimelineStep } from "@/features/missions/lib/append-mission-timeline-step";
import { buildMissionExecutionContext } from "@/features/missions/lib/build-mission-execution-context";
import { resolveMissionSkillPromptBlocks } from "@/features/missions/lib/resolve-mission-skill-prompts";
import {
  detectMissionLanguage,
  missionLanguageLabel,
} from "@/features/missions/lib/detect-mission-language";
import { buildEvidenceFromSearch } from "@/features/missions/lib/mission-research-evidence";
import { filterVerifiedMissionLeads } from "@/features/missions/lib/verify-lead-contact";
import { filterRuQualifiedMissionLeads } from "@/features/missions/lib/qualify-ru-mission-lead";
import {
  missionUsesRuQualification,
  RU_PROSPECTING_PLAN,
} from "@/features/missions/lib/mission-qualification-mode";
import { parseMissionLeadsFromModelOutput } from "@/features/missions/services/create-employee-mission";
import { researchMissionProspects } from "@/features/missions/services/research-mission-prospects";
import { sendMissionContactsDigestEmail } from "@/shared/email/send-mission-contacts-digest-email";
import { db } from "@/shared/db/client";
import { inngest } from "@/inngest/client";

const PROSPECTING_PLAN = `1. Research target companies using web search.
2. Find verified B2B decision-maker contacts (published email + source URL).
3. Qualify companies with enterprise budget signals.
4. Draft personalized digital employee proposals in the mission language.
5. Submit proposals for human approval before any outbound send.`;

const LEAD_SCHEMA_HINT = `{ "leads": [{ "companyName": "string", "domain": "string", "whyFit": "string", "budgetSignal": "string", "contactName": "string", "contactHypothesis": "string", "contactEmail": "string", "contactSourceUrl": "string", "proposalDraft": "string" }] }`;

const RU_LEAD_SCHEMA_HINT = `{ "leads": [{ "companyName": "string", "domain": "string", "isRussianCompany": true, "countryEvidence": "string", "sector": "string", "marketTenureYears": 0, "foundedYear": 0, "estimatedRevenueRub": "string", "revenueSourceUrl": "string", "whyFit": "string", "contactName": "string", "contactEmail": "string", "contactSourceUrl": "string", "agentPlan": "string", "proposalDraft": "string" }] }`;

function buildLeadExtractionRules(
  language: "ru" | "en",
  ruQualification: boolean,
): string[] {
  if (ruQualification) {
    return [
      "Режим RU Market Qualification: только компании из России с подтверждённым evidence.",
      "isRussianCompany=true только при явном сигнале РФ в research; countryEvidence — цитата/факт из источника.",
      "sector — сектор/отрасль/ОКВЭД из research, не угадывать.",
      "marketTenureYears / foundedYear — только из research или null.",
      "estimatedRevenueRub — только если цифра дословно в research; иначе null. revenueSourceUrl обязателен при указании выручки.",
      "contactEmail — только дословно из research. Без контакта — не включай lead.",
      "agentPlan — план захода от digital employee (3–5 шагов). proposalDraft — короткое письмо на основе плана.",
      "Не включай компании без подтверждённого контакта.",
      "Верни до 10 qualified leads.",
    ];
  }

  if (language === "ru") {
    return [
      "Пиши proposalDraft только на русском.",
      "contactEmail — только если email дословно есть в research. Запрещено угадывать (info@, sales@, digital@ и т.п.).",
      "contactName — полное имя человека из источника.",
      "contactSourceUrl — URL страницы, где найден контакт или email.",
      "Если нет подтверждённого email — не включай lead в массив.",
      "Верни до 10 leads с подтверждёнными контактами.",
    ];
  }

  return [
    "Write proposalDraft in English only.",
    "contactEmail only when the email appears verbatim in research. Never guess (info@, sales@, digital@, etc.).",
    "contactName is the person's full name from the source.",
    "contactSourceUrl is the page URL where the contact or email was found.",
    "If there is no verified email, do not include the lead.",
    "Return up to 10 leads with verified contacts.",
  ];
}

async function generateProspectingLeads(input: {
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  missionContext: string;
  searchResults: string;
  language: "ru" | "en";
  ruQualification: boolean;
}): Promise<MissionLeadItem[]> {
  const schemaHint = input.ruQualification ? RU_LEAD_SCHEMA_HINT : LEAD_SCHEMA_HINT;
  const extractionRules = buildLeadExtractionRules(
    input.language,
    input.ruQualification,
  );

  const brainRequest = await buildTalkBrainRequest({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    messages: [
      {
        role: "user",
        content: [
          `You are ${input.employeeName}, a ${input.employeeRole}.`,
          input.missionContext,
          `Mission language: ${missionLanguageLabel(input.language)}`,
          "",
          ...extractionRules,
          "",
          "Research:",
          input.searchResults,
        ].join("\n"),
      },
    ],
  });

  if (!brainRequest) {
    throw new Error("Employee runtime not configured for mission processing");
  }

  const raw = await collectTalkBrainResponse({
    brainProvider: brainRequest.brainProvider,
    model: brainRequest.model,
    systemPrompt: [
      brainRequest.systemPrompt,
      "",
      "You are operating in data-extraction mode.",
      "Output ONLY a single JSON object. No prose, no markdown, no code fences.",
      `The JSON must match this shape: ${schemaHint}`,
      input.ruQualification
        ? "Every lead MUST include isRussianCompany=true, countryEvidence, sector, agentPlan, contactName, contactEmail, contactSourceUrl, and proposalDraft."
        : "Every lead MUST include non-empty companyName, whyFit, proposalDraft, contactName, contactEmail, and contactSourceUrl.",
      ...extractionRules,
      "Do not invent companies or contacts not supported by the research corpus.",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `You are ${input.employeeName}, a ${input.employeeRole}.`,
          input.missionContext,
          "",
          "Use the research below to produce qualified leads for NULLXES Digital Employees.",
          "",
          "Research:",
          input.searchResults,
        ].join("\n"),
      },
    ],
    temperature: 0.2,
    maxTokens: brainRequest.maxTokens,
    responseFormat: { type: "json_object" },
  });

  const parsed = parseMissionLeadsFromModelOutput(raw);
  return input.ruQualification
    ? filterRuQualifiedMissionLeads(parsed, input.searchResults)
    : filterVerifiedMissionLeads(parsed, input.searchResults);
}

async function processMissionById(missionId: string, organizationId: string) {
  const mission = await db.query.employeeMission.findFirst({
    where: and(
      eq(employeeMission.id, missionId),
      eq(employeeMission.organizationId, organizationId),
    ),
    with: { employee: true },
  });

  if (!mission?.employee) {
    return { missionId, skipped: true, reason: "mission_not_found" };
  }

  if (
    mission.status === "completed" ||
    mission.status === "cancelled" ||
    mission.status === "waiting_approval"
  ) {
    return { missionId, skipped: true, reason: "mission_already_final" };
  }

  let timeline = mission.timeline ?? [];
  const language = detectMissionLanguage(mission.brief, mission.goal);

  const ruQualification = await missionUsesRuQualification({
    organizationId,
    skillIds: mission.skillIds ?? [],
  });

  const skillPromptBlocks = await resolveMissionSkillPromptBlocks(
    mission.skillIds ?? [],
  );

  try {
    await db
      .update(employeeMission)
      .set({
        status: "working",
        plan: ruQualification ? RU_PROSPECTING_PLAN : PROSPECTING_PLAN,
        timeline: appendMissionTimelineStep(timeline, {
          key: "working",
          label: "Mission started",
        }),
      })
      .where(eq(employeeMission.id, missionId));

    timeline = appendMissionTimelineStep(timeline, {
      key: "working",
      label: "Mission started",
    });

    await recordWorkEvent({
      organizationId,
      employeeId: mission.employeeId,
      eventType: "task_received",
      title: mission.title,
      summary: mission.brief,
      metadata: { missionId, type: mission.type },
    });

    const missionContext = buildMissionExecutionContext({
      brief: mission.brief,
      goal: mission.goal,
      skills: mission.skills,
      skillPromptBlocks,
    });

    const searchResults = await researchMissionProspects({
      missionContext,
      brief: mission.brief,
      goal: mission.goal,
      ruQualification,
    });

    const evidence: MissionEvidenceItem[] = buildEvidenceFromSearch(searchResults);

    timeline = appendMissionTimelineStep(timeline, {
      key: "researched",
      label: "Web research completed",
    });

    await db
      .update(employeeMission)
      .set({
        evidence,
        timeline,
      })
      .where(eq(employeeMission.id, missionId));

    const leads = await generateProspectingLeads({
      organizationId,
      employeeId: mission.employeeId,
      employeeName: mission.employee.name,
      employeeRole: mission.employee.role,
      missionContext,
      searchResults,
      language,
      ruQualification,
    });

    if (leads.length === 0) {
      throw new Error(
        language === "ru"
          ? ruQualification
            ? "Не найдено российских leads с подтверждёнными контактами, сектором и планом захода."
            : "Не найдено leads с подтверждёнными B2B контактами из web research."
          : ruQualification
            ? "No Russian leads with verified contacts, sector, and agent plan found."
            : "No leads with verified B2B contacts found in web research.",
      );
    }

    timeline = appendMissionTimelineStep(timeline, {
      key: "drafted",
      label: `${leads.length} proposal drafts prepared`,
    });

    await sendMissionContactsDigestEmail({
      missionTitle: mission.title,
      employeeName: mission.employee.name,
      language,
      leads,
      research: searchResults,
    });

    timeline = appendMissionTimelineStep(timeline, {
      key: "contacts_digest",
      label: "Contacts digest sent to CEO",
    });

    const [approval] = await db
      .insert(agentApprovalRequest)
      .values({
        organizationId,
        employeeId: mission.employeeId,
        actionType: "mission_proposals",
        payload: {
          missionId,
          title: mission.title,
          leadCount: leads.length,
          preview: leads.slice(0, 3).map((lead) => ({
            companyName: lead.companyName,
            whyFit: lead.whyFit,
            contactEmail: lead.contactEmail,
          })),
        },
        status: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      })
      .returning({ id: agentApprovalRequest.id });

    timeline = appendMissionTimelineStep(timeline, {
      key: "waiting_approval",
      label: "Waiting for proposal approval",
    });

    await db
      .update(employeeMission)
      .set({
        status: "waiting_approval",
        leads,
        timeline,
      })
      .where(eq(employeeMission.id, missionId));

    await recordWorkEvent({
      organizationId,
      employeeId: mission.employeeId,
      eventType: "approval_requested",
      title: `Mission proposals ready · ${mission.title}`,
      summary: `${leads.length} proposals waiting for approval`,
      metadata: { missionId, approvalId: approval?.id, leadCount: leads.length },
    });

    return {
      missionId,
      status: "waiting_approval" as const,
      leadCount: leads.length,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    await db
      .update(employeeMission)
      .set({
        status: "failed",
        errorMessage: message,
        timeline: appendMissionTimelineStep(timeline, {
          key: "failed",
          label: "Mission failed",
        }),
        completedAt: new Date(),
      })
      .where(eq(employeeMission.id, missionId));

    await recordWorkEvent({
      organizationId,
      employeeId: mission.employeeId,
      eventType: "task_completed",
      title: `Mission failed · ${mission.title}`,
      summary: message,
      metadata: { missionId, failed: true },
    });

    throw error;
  }
}

export const processEmployeeMissionStarted = inngest.createFunction(
  {
    id: "process-employee-mission-started",
    triggers: [{ event: "employee/mission.started" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { missionId, organizationId } = event.data as {
      missionId: string;
      organizationId: string;
    };

    return step.run("process-mission", async () =>
      processMissionById(missionId, organizationId),
    );
  },
);
