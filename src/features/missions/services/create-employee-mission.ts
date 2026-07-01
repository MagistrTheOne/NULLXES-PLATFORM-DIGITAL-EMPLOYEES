import { and, eq } from "drizzle-orm";
import {
  employeeMission,
  type MissionLeadItem,
  type MissionSource,
} from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { appendMissionTimelineStep } from "../lib/append-mission-timeline-step";
import {
  defaultProspectingBrief,
  defaultProspectingTitle,
} from "../lib/prospecting-defaults";
import { db } from "@/shared/db/client";

export { defaultProspectingBrief, defaultProspectingTitle };

export async function createEmployeeMission(input: {
  organizationId: string;
  employeeId: string;
  createdByUserId: string;
  title: string;
  goal?: string | null;
  skills?: string[];
  brief: string;
  type: "prospecting" | "custom";
  source?: MissionSource;
  scheduleId?: string;
}): Promise<string> {
  const [employee] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.id, input.employeeId),
        eq(digitalEmployee.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const [mission] = await db
    .insert(employeeMission)
    .values({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      createdByUserId: input.createdByUserId,
      title: input.title,
      goal: input.goal ?? null,
      skills: input.skills ?? [],
      brief: input.brief,
      type: input.type,
      source: input.source ?? "manual",
      scheduleId: input.scheduleId,
      status: "planned",
      timeline: appendMissionTimelineStep([], {
        key: "planned",
        label:
          input.source === "scheduled"
            ? "Scheduled mission run started"
            : "Mission assigned",
      }),
    })
    .returning({ id: employeeMission.id });

  if (!mission) {
    throw new Error("Failed to create mission");
  }

  return mission.id;
}

export async function enqueueEmployeeMission(input: {
  missionId: string;
  organizationId: string;
}): Promise<void> {
  if (!isInngestEnabledForSend()) {
    return;
  }

  await inngest.send({
    name: "employee/mission.started",
    data: {
      missionId: input.missionId,
      organizationId: input.organizationId,
    },
  });
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function extractJsonCandidate(raw: string): string | null {
  const cleaned = stripCodeFences(raw);

  const objectStart = cleaned.indexOf("{");
  const arrayStart = cleaned.indexOf("[");
  const start =
    objectStart === -1
      ? arrayStart
      : arrayStart === -1
        ? objectStart
        : Math.min(objectStart, arrayStart);

  if (start === -1) {
    return null;
  }

  const openChar = cleaned[start];
  const closeChar = openChar === "{" ? "}" : "]";
  const end = cleaned.lastIndexOf(closeChar);
  if (end <= start) {
    return null;
  }

  return cleaned.slice(start, end + 1);
}

export function parseMissionLeadsFromModelOutput(raw: string): MissionLeadItem[] {
  const candidate = extractJsonCandidate(raw);
  if (!candidate) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return [];
  }

  const leadsSource = Array.isArray(parsed)
    ? parsed
    : (parsed as { leads?: unknown; results?: unknown; companies?: unknown })
        ?.leads ??
      (parsed as { results?: unknown })?.results ??
      (parsed as { companies?: unknown })?.companies;

  if (!Array.isArray(leadsSource)) {
    return [];
  }

  return leadsSource
    .map((entry) => {
      const lead = (entry ?? {}) as Record<string, unknown>;
      const companyName = String(
        lead.companyName ?? lead.company ?? lead.name ?? "",
      ).trim();
      const whyFit = String(lead.whyFit ?? lead.reason ?? lead.fit ?? "").trim();
      const proposalDraft = String(
        lead.proposalDraft ?? lead.proposal ?? lead.pitch ?? "",
      ).trim();

      return {
        companyName,
        domain: lead.domain ? String(lead.domain).trim() : undefined,
        whyFit: whyFit || (companyName ? `Potential fit for ${companyName}.` : ""),
        budgetSignal: lead.budgetSignal
          ? String(lead.budgetSignal).trim()
          : undefined,
        contactHypothesis: lead.contactHypothesis
          ? String(lead.contactHypothesis).trim()
          : undefined,
        contactEmail: lead.contactEmail
          ? String(lead.contactEmail).trim()
          : undefined,
        proposalDraft:
          proposalDraft ||
          (companyName
            ? `Proposal: deploy NULLXES Digital Employees to support ${companyName}.`
            : ""),
      };
    })
    .filter((lead) => lead.companyName.length > 0)
    .slice(0, 10);
}
