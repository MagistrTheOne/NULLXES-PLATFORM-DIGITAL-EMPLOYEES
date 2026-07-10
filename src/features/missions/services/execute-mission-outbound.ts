import { and, eq } from "drizzle-orm";
import { employeeMission, type MissionLeadItem } from "@/entities/employee-mission";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { detectMissionLanguage } from "@/features/missions/lib/detect-mission-language";
import { normalizeProposalDraft } from "@/features/missions/lib/normalize-proposal-draft";
import { extractMissionResearchCorpus } from "@/features/missions/lib/mission-research-evidence";
import { isVerifiedLeadContact } from "@/features/missions/lib/verify-lead-contact";
import { appendMissionTimelineStep } from "@/features/missions/lib/append-mission-timeline-step";
import { startMissionHandoffChain } from "@/features/missions/services/mission-handoff-chain";
import { recordWorkEvent } from "@/features/work-event";
import { sendMissionProposalEmail } from "@/shared/email/send-mission-proposal-email";
import { inngest, isInngestEnabledForSend } from "@/inngest/client";
import { db } from "@/shared/db/client";

function resolveLeadRecipient(lead: MissionLeadItem, research: string): string | null {
  const explicit = lead.contactEmail?.trim();
  if (!explicit || !explicit.includes("@")) {
    return null;
  }

  if (!isVerifiedLeadContact(lead, research)) {
    return null;
  }

  return explicit;
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
      brief: employeeMission.brief,
      goal: employeeMission.goal,
      leads: employeeMission.leads,
      evidence: employeeMission.evidence,
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

  const research = extractMissionResearchCorpus(mission.evidence);
  const language = detectMissionLanguage(mission.brief, mission.goal);
  const leads = [...(mission.leads ?? [])];
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let index = 0; index < leads.length; index += 1) {
    const lead = leads[index];
    const recipient = resolveLeadRecipient(lead, research);

    if (!recipient) {
      skippedCount += 1;
      leads[index] = {
        ...lead,
        sendError:
          language === "ru"
            ? "Нет подтверждённого email контакта из research."
            : "No verified contact email from research.",
      };
      continue;
    }

    const delivery = await sendMissionProposalEmail({
      to: recipient,
      companyName: lead.companyName,
      employeeName: mission.employeeName,
      proposalDraft: normalizeProposalDraft(lead.proposalDraft, language),
      language,
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

  if (sentCount === 0) {
    await db
      .update(employeeMission)
      .set({
        status: "failed",
        leads,
        timeline,
        completedAt: new Date(),
        errorMessage:
          language === "ru"
            ? "Ни одно письмо не отправлено. Нужны подтверждённые контакты из research и настроенный Resend."
            : "No proposal emails were delivered. Verified research contacts and Resend are required.",
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

  const handoffTimeline = appendMissionTimelineStep(timeline, {
    key: "handoff_queued",
    label: "Starting workforce handoff",
  });

  await db
    .update(employeeMission)
    .set({
      status: "working",
      leads,
      timeline: handoffTimeline,
      completedAt: null,
      errorMessage: undefined,
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

  if (isInngestEnabledForSend()) {
    await inngest.send({
      name: "employee/mission.handoff.start",
      data: {
        missionId: input.missionId,
        organizationId: input.organizationId,
      },
    });
  } else {
    await startMissionHandoffChain({
      missionId: input.missionId,
      organizationId: input.organizationId,
    });
  }

  return {
    missionId: input.missionId,
    sentCount,
    failedCount,
    skippedCount,
  };
}
