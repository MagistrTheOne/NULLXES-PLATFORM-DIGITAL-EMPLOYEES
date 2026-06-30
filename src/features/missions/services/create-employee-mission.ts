import { and, eq } from "drizzle-orm";
import {
  employeeMission,
  type MissionLeadItem,
} from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { appendMissionTimelineStep } from "../lib/append-mission-timeline-step";
import { db } from "@/shared/db/client";

export async function createEmployeeMission(input: {
  organizationId: string;
  employeeId: string;
  createdByUserId: string;
  title: string;
  brief: string;
  type: "prospecting" | "custom";
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
      brief: input.brief,
      type: input.type,
      status: "planned",
      timeline: appendMissionTimelineStep([], {
        key: "planned",
        label: "Mission assigned",
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

export function defaultProspectingBrief(): string {
  return "Find 10 B2B companies that could benefit from NULLXES Digital Employees. Focus on companies with enterprise budgets and operational teams that could delegate work to digital employees.";
}

export function defaultProspectingTitle(employeeName: string): string {
  return `${employeeName} · B2B prospecting mission`;
}

export function parseMissionLeadsFromModelOutput(raw: string): MissionLeadItem[] {
  const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as
      | { leads?: MissionLeadItem[] }
      | MissionLeadItem[];

    const leads = Array.isArray(parsed) ? parsed : parsed.leads;
    if (!Array.isArray(leads)) {
      return [];
    }

    return leads
      .map((lead) => ({
        companyName: String(lead.companyName ?? "").trim(),
        domain: lead.domain ? String(lead.domain).trim() : undefined,
        whyFit: String(lead.whyFit ?? "").trim(),
        budgetSignal: lead.budgetSignal
          ? String(lead.budgetSignal).trim()
          : undefined,
        contactHypothesis: lead.contactHypothesis
          ? String(lead.contactHypothesis).trim()
          : undefined,
        proposalDraft: String(lead.proposalDraft ?? "").trim(),
      }))
      .filter((lead) => lead.companyName && lead.whyFit && lead.proposalDraft)
      .slice(0, 10);
  } catch {
    return [];
  }
}
