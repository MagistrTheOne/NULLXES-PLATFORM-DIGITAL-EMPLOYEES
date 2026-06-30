import { and, eq } from "drizzle-orm";
import { employeeMission, type MissionLeadItem } from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { appendMissionTimelineStep } from "@/features/missions/lib/append-mission-timeline-step";
import { recordWorkEvent } from "@/features/work-event";
import { sendMissionProposalEmail } from "@/shared/email/send-mission-proposal-email";
import { db } from "@/shared/db/client";

function proposalHtmlFromDraft(draft: string): string {
  const paragraphs = draft
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return `<p>${draft.trim()}</p>`;
  }

  return paragraphs.map((part) => `<p>${part}</p>`).join("");
}

function resolveLeadRecipient(lead: MissionLeadItem): string | null {
  const explicit = lead.contactEmail?.trim();
  if (explicit && explicit.includes("@")) {
    return explicit;
  }

  const hypothesis = lead.contactHypothesis?.trim() ?? "";
  const emailInHypothesis = hypothesis.match(/[^\s<>]+@[^\s<>]+/);
  if (emailInHypothesis) {
    return emailInHypothesis[0];
  }

  const domain = lead.domain?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (domain && domain.includes(".")) {
    return `info@${domain}`;
  }

  return null;
}

export async function executeMissionOutbound(input: {
  missionId: string;
  organizationId: string;
}): Promise<{
  missionId: string;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
}> {
  const [mission] = await db
    .select({
      id: employeeMission.id,
      employeeId: employeeMission.employeeId,
      title: employeeMission.title,
      leads: employeeMission.leads,
      timeline: employeeMission.timeline,
      employeeName: digitalEmployee.name,
    })
    .from(employeeMission)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, employeeMission.employeeId),
    )
    .where(
      and(
        eq(employeeMission.id, input.missionId),
        eq(employeeMission.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!mission) {
    throw new Error("Mission not found");
  }

  const leads = [...(mission.leads ?? [])];
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let index = 0; index < leads.length; index += 1) {
    const lead = leads[index];
    const recipient = resolveLeadRecipient(lead);

    if (!recipient) {
      skippedCount += 1;
      leads[index] = {
        ...lead,
        sendError: "No deliverable email address for this lead.",
      };
      continue;
    }

    const delivery = await sendMissionProposalEmail({
      to: recipient,
      companyName: lead.companyName,
      employeeName: mission.employeeName,
      proposalHtml: proposalHtmlFromDraft(lead.proposalDraft),
    });

    if (delivery.sent) {
      sentCount += 1;
      leads[index] = {
        ...lead,
        contactEmail: recipient,
        sentAt: new Date().toISOString(),
        sendError: undefined,
      };
    } else {
      failedCount += 1;
      leads[index] = {
        ...lead,
        contactEmail: recipient,
        sendError: delivery.error ?? "Send failed",
      };
    }
  }

  const timeline = appendMissionTimelineStep(mission.timeline ?? [], {
    key: "outbound_sent",
    label: `Outbound complete · ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped`,
  });

  const status =
    sentCount > 0 && failedCount === 0 && skippedCount === 0
      ? "completed"
      : sentCount > 0
        ? "completed"
        : "failed";

  await db
    .update(employeeMission)
    .set({
      status,
      leads,
      timeline,
      completedAt: new Date(),
      errorMessage:
        sentCount === 0
          ? "No proposal emails were delivered. Check contact emails and Resend configuration."
          : undefined,
    })
    .where(eq(employeeMission.id, input.missionId));

  await recordWorkEvent({
    organizationId: input.organizationId,
    employeeId: mission.employeeId,
    eventType: "api_response_sent",
    title: `Mission outbound · ${mission.title}`,
    summary: `${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped`,
    metadata: {
      missionId: input.missionId,
      sentCount,
      failedCount,
      skippedCount,
    },
  });

  return {
    missionId: input.missionId,
    sentCount,
    failedCount,
    skippedCount,
  };
}
