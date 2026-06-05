import { getResendClient, getResendFromAddress } from "./resend-client";

export async function sendNotificationEmail(input: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ sent: boolean; recipientCount: number }> {
  const resend = getResendClient();
  const recipients = input.to.filter(Boolean);

  if (!resend || recipients.length === 0) {
    return { sent: false, recipientCount: 0 };
  }

  await resend.emails.send({
    from: getResendFromAddress(),
    to: recipients,
    subject: input.subject,
    html: input.html,
  });

  return { sent: true, recipientCount: recipients.length };
}
