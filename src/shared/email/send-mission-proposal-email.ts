import {
  getResendAutomationFromAddress,
  getResendClient,
} from "./resend-client";

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
  proposalHtml: string;
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY is not configured." };
  }

  const to = input.to.trim();
  if (!to.includes("@")) {
    return { sent: false, error: "Invalid recipient email." };
  }

  try {
    const { error } = await resend.emails.send({
      from: buildMissionFromAddress(input.employeeName),
      to: [to],
      subject: `NULLXES Digital Employees · ${input.companyName}`,
      html: `
        <p>Hello,</p>
        ${input.proposalHtml}
        <p>Best regards,<br/>${input.employeeName}<br/>NULLXES Digital Employees</p>
      `.trim(),
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
