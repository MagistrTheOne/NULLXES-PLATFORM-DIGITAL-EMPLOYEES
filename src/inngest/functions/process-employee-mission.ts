import { and, eq } from "drizzle-orm";
import { agentApprovalRequest } from "@/entities/agent-approval/schema";
import {
  employeeMission,
  type MissionEvidenceItem,
  type MissionLeadItem,
} from "@/entities/employee-mission";
import { searchWebOpenAi } from "@/features/agent-tools/services/search-web-openai";
import { buildTalkBrainRequest } from "@/features/runtime-session/services/build-talk-brain-request";
import { collectTalkBrainResponse } from "@/features/runtime-session/services/stream-talk-brain-response";
import { recordWorkEvent } from "@/features/work-event";
import { appendMissionTimelineStep } from "@/features/missions/lib/append-mission-timeline-step";
import { parseMissionLeadsFromModelOutput } from "@/features/missions/services/create-employee-mission";
import { db } from "@/shared/db/client";
import { inngest } from "@/inngest/client";

const PROSPECTING_PLAN = `1. Research target companies using web search.
2. Qualify companies with enterprise budget signals.
3. Draft personalized digital employee proposals.
4. Submit proposals for human approval before any outbound send.`;

function buildEvidenceFromSearch(searchResults: string): MissionEvidenceItem[] {
  const urlMatches = [...searchResults.matchAll(/https?:\/\/[^\s)>\]"']+/g)]
    .map((match) => match[0])
    .slice(0, 8);

  if (urlMatches.length === 0) {
    return [
      {
        source: "Web research",
        snippet: searchResults.slice(0, 500),
      },
    ];
  }

  return urlMatches.map((url, index) => ({
    source: `Source ${index + 1}`,
    url,
    snippet: searchResults.slice(0, 240),
  }));
}

async function generateProspectingLeads(input: {
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  brief: string;
  searchResults: string;
}): Promise<MissionLeadItem[]> {
  const brainRequest = await buildTalkBrainRequest({
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    messages: [
      {
        role: "user",
        content: [
          `You are ${input.employeeName}, a ${input.employeeRole}.`,
          `Mission brief: ${input.brief}`,
          "",
          "Using the research below, return JSON only:",
          `{ "leads": [{ "companyName": "", "domain": "", "whyFit": "", "budgetSignal": "", "contactHypothesis": "", "contactEmail": "", "proposalDraft": "" }] }`,
          "Return up to 10 qualified leads with concise proposal drafts for NULLXES Digital Employees.",
          "Include contactEmail when you can infer a plausible business email (e.g. sales@domain.com).",
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
    systemPrompt: `${brainRequest.systemPrompt}\n\nRespond with valid JSON only.`,
    messages: [
      {
        role: "user",
        content: `Mission brief: ${input.brief}\n\nResearch:\n${input.searchResults}`,
      },
    ],
    temperature: 0.4,
    maxTokens: brainRequest.maxTokens,
  });

  return parseMissionLeadsFromModelOutput(raw);
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

  try {
    await db
      .update(employeeMission)
      .set({
        status: "working",
        plan: PROSPECTING_PLAN,
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

    const searchQuery =
      mission.type === "prospecting"
        ? `${mission.brief} enterprise B2B companies budget digital workforce automation`
        : mission.brief;

    const searchResults = await searchWebOpenAi(searchQuery);
    const evidence = buildEvidenceFromSearch(searchResults);

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
      brief: mission.brief,
      searchResults,
    });

    if (leads.length === 0) {
      throw new Error("Mission produced no qualified leads");
    }

    timeline = appendMissionTimelineStep(timeline, {
      key: "drafted",
      label: `${leads.length} proposal drafts prepared`,
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
