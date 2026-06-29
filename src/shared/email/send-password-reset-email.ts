import { getResendClient, getResendFromAddress } from "./resend-client";

export async function sendPasswordResetEmail(input: {
  email: string;
  url: string;
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.error(
      `[password-reset] RESEND_API_KEY missing — reset email not sent to ${input.email}`,
    );
    return { sent: false, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [input.email],
      subject: "Reset your NULLXES password",
      html: `
        <p>We received a request to reset your NULLXES password.</p>
        <p><a href="${input.url}">Reset password</a></p>
        <p>This link expires soon. If you did not request a reset, ignore this email.</p>
      `.trim(),
    });

    if (error) {
      const message =
        typeof error.message === "string" ? error.message : "Resend rejected the send.";
      console.error(`[password-reset] Resend failed for ${input.email}:`, message);
      return { sent: false, error: message };
    }

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[password-reset] Resend failed for ${input.email}:`, message);
    return { sent: false, error: message };
  }
}
