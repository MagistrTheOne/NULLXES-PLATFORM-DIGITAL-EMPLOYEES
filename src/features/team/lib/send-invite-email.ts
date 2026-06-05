import { getResendClient, getResendFromAddress } from "@/shared/email/resend-client";
import { buildInviteAcceptUrl } from "./build-invite-accept-url";

export async function sendInviteEmail(input: {
  email: string;
  organizationName: string;
  role: string;
  token: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false };
  }

  const acceptUrl = buildInviteAcceptUrl(input.token);

  await resend.emails.send({
    from: getResendFromAddress(),
    to: input.email,
    subject: `Join ${input.organizationName} on NULLXES`,
    html: `<p>You were invited to <strong>${input.organizationName}</strong> as <strong>${input.role}</strong>.</p><p><a href="${acceptUrl}">Accept invite</a></p><p>This link expires in 7 days.</p>`,
  });

  return { sent: true };
}
