import { and, eq } from "drizzle-orm";
import {
  employeeMission,
  type MissionLeadItem,
  type MissionSource,
} from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { appendMissionTimelineStep } from "../lib/append-mission-timeline-step";
import { ensureMissionSkillIds } from "../lib/ensure-mission-skill-ids";
import type { MissionType } from "../lib/mission-type";
import {
  defaultProspectingBrief,
  defaultProspectingTitle,
} from "../lib/prospecting-defaults";
import { db } from "@/shared/db/client";
import { normalizeProposalDraft } from "../lib/normalize-proposal-draft";
import { detectMissionLanguage } from "../lib/detect-mission-language";
import { forbidCatalogMutation } from "@/features/employees/services/platform-employee-catalog";

export { defaultProspectingBrief, defaultProspectingTitle };

export async function createEmployeeMission(input: {
  organizationId: string;
  employeeId: string;
  createdByUserId: string;
  title: string;
  goal?: string | null;
  skills?: string[];
  skillIds?: string[];
  brief: string;
  type: MissionType;
  source?: MissionSource;
  scheduleId?: string;
}): Promise<string> {
  await forbidCatalogMutation(input.employeeId, input.organizationId);

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

  const skillIds = await ensureMissionSkillIds({
    organizationId: input.organizationId,
    type: input.type,
    skillIds: input.skillIds ?? [],
  });

  const [mission] = await db
    .insert(employeeMission)
    .values({
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      createdByUserId: input.createdByUserId,
      title: input.title,
      goal: input.goal ?? null,
      skills: input.skills ?? [],
      skillIds,
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

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
      const agentPlan = String(lead.agentPlan ?? lead.plan ?? "").trim();

      const marketTenureYears = parseOptionalNumber(
        lead.marketTenureYears ?? lead.yearsOnMarket,
      );
      const foundedYear = parseOptionalNumber(lead.foundedYear ?? lead.founded);

      return {
        companyName,
        domain: lead.domain ? String(lead.domain).trim() : undefined,
        whyFit: whyFit || (companyName ? `Potential fit for ${companyName}.` : ""),
        budgetSignal: lead.budgetSignal
          ? String(lead.budgetSignal).trim()
          : undefined,
        isRussianCompany:
          lead.isRussianCompany === true || lead.isRussianCompany === "true"
            ? true
            : lead.isRussianCompany === false || lead.isRussianCompany === "false"
              ? false
              : undefined,
        countryEvidence: lead.countryEvidence
          ? String(lead.countryEvidence).trim()
          : undefined,
        countryCode: lead.countryCode
          ? String(lead.countryCode).trim().toUpperCase()
          : undefined,
        sector: lead.sector ? String(lead.sector).trim() : undefined,
        marketTenureYears,
        foundedYear,
        estimatedRevenueRub: lead.estimatedRevenueRub
          ? String(lead.estimatedRevenueRub).trim()
          : lead.revenueRub
            ? String(lead.revenueRub).trim()
            : null,
        estimatedRevenueUsd: lead.estimatedRevenueUsd
          ? String(lead.estimatedRevenueUsd).trim()
          : lead.revenueUsd
            ? String(lead.revenueUsd).trim()
            : null,
        revenueSourceUrl: lead.revenueSourceUrl
          ? String(lead.revenueSourceUrl).trim()
          : null,
        investorType: lead.investorType
          ? String(lead.investorType).trim()
          : undefined,
        stageFocus: lead.stageFocus
          ? String(lead.stageFocus).trim()
          : undefined,
        ticketSizeUsd: lead.ticketSizeUsd
          ? String(lead.ticketSizeUsd).trim()
          : null,
        sectorFocus: lead.sectorFocus
          ? String(lead.sectorFocus).trim()
          : undefined,
        portfolioFit: lead.portfolioFit
          ? String(lead.portfolioFit).trim()
          : undefined,
        contactHypothesis: lead.contactHypothesis
          ? String(lead.contactHypothesis).trim()
          : undefined,
        contactName: lead.contactName
          ? String(lead.contactName).trim()
          : undefined,
        contactEmail: lead.contactEmail
          ? String(lead.contactEmail).trim()
          : undefined,
        contactSourceUrl: lead.contactSourceUrl
          ? String(lead.contactSourceUrl).trim()
          : lead.sourceUrl
            ? String(lead.sourceUrl).trim()
            : undefined,
        agentPlan: agentPlan || undefined,
        proposalDraft: normalizeProposalDraft(
          proposalDraft ||
            agentPlan ||
            (companyName
              ? `Proposal: deploy NULLXES Digital Employees to support ${companyName}.`
              : ""),
          detectMissionLanguage(
            `${proposalDraft} ${agentPlan} ${companyName} ${whyFit}`,
          ),
        ),
      };
    })
    .filter((lead) => lead.companyName.length > 0)
    .slice(0, 10);
}
