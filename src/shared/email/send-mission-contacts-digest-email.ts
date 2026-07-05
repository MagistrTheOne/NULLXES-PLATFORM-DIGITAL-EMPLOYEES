import type { MissionLeadItem } from "@/entities/employee-mission";
import { isVerifiedLeadContact } from "@/features/missions/lib/verify-lead-contact";
import { buildMissionContactsDigestHtml } from "./mission-proposal-html";
import {
  getResendAutomationFromAddress,
  getResendClient,
} from "./resend-client";

export function getMissionContactsDigestRecipient(): string {
  return (
    process.env.MISSION_CONTACTS_DIGEST_EMAIL?.trim() ?? "ceo@nullxes.com"
  );
}

export async function sendMissionContactsDigestEmail(input: {
  missionTitle: string;
  employeeName: string;
  language: "ru" | "en";
  leads: MissionLeadItem[];
  research: string;
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY is not configured." };
  }

  const to = getMissionContactsDigestRecipient();
  const subject =
    input.language === "ru"
      ? `NULLXES · Контакты миссии · ${input.missionTitle}`
      : `NULLXES · Mission contacts · ${input.missionTitle}`;

  const html = buildMissionContactsDigestHtml({
    missionTitle: input.missionTitle,
    employeeName: input.employeeName,
    language: input.language,
    leads: input.leads.map((lead) => ({
      companyName: lead.companyName,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      contactSourceUrl: lead.contactSourceUrl,
      verified: isVerifiedLeadContact(lead, input.research),
      whyFit: lead.whyFit,
      sector: lead.sector,
      marketTenureYears: lead.marketTenureYears,
      foundedYear: lead.foundedYear,
      estimatedRevenueRub: lead.estimatedRevenueRub,
      agentPlan: lead.agentPlan,
    })),
  });

  try {
    const { error } = await resend.emails.send({
      from: getResendAutomationFromAddress(),
      to: [to],
      subject,
      html,
    });

    if (error) {
      const message =
        typeof error.message === "string"
          ? error.message
          : "Resend rejected the digest send.";
      return { sent: false, error: message };
    }

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { sent: false, error: message };
  }
}
