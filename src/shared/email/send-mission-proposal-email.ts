import {
  getResendAutomationFromAddress,
  getResendClient,
} from "./resend-client";
import { buildMissionOutboundEmailHtml } from "./mission-proposal-html";

function buildMissionFromAddress(employeeName: string): string {
  const configured = getResendAutomationFromAddress();
  const match = configured.match(/^(.+?)<([^>]+)>$/);
  if (match) {
    const email = match[2]?.trim();
    if (email) {
      return `${employeeName.trim()} · NULLXES Digital Employees <${email}>`;
    }
  }

  if (configured.includes("@")) {
    return `${employeeName.trim()} · NULLXES Digital Employees <${configured}>`;
  }

  return configured;
}

export async function sendMissionProposalEmail(input: {
  to: string;
  companyName: string;
  employeeName: string;
  proposalDraft: string;
  language: "ru" | "en";
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY is not configured." };
  }

  const to = input.to.trim();
  if (!to.includes("@")) {
    return { sent: false, error: "Invalid recipient email." };
  }

  const html = buildMissionOutboundEmailHtml({
    companyName: input.companyName,
    employeeName: input.employeeName,
    proposalDraft: input.proposalDraft,
    language: input.language,
  });

  try {
    const { error } = await resend.emails.send({
      from: buildMissionFromAddress(input.employeeName),
      to: [to],
      subject: `NULLXES Digital Employees · ${input.companyName}`,
      html,
    });

    if (error) {
      const message =
        typeof error.message === "string" ? error.message : "Resend rejected the send.";
      console.error(`[mission-outbound] Resend failed for ${to}:`, message);
      return { sent: false, error: message };
    }

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[mission-outbound] Resend failed for ${to}:`, message);
    return { sent: false, error: message };
  }
}
