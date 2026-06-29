import { getResendClient, getResendFromAddress } from "./resend-client";

type OtpEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

const SUBJECTS: Record<OtpEmailType, string> = {
  "sign-in": "Your NULLXES sign-in code",
  "email-verification": "Verify your NULLXES email",
  "forget-password": "Reset your NULLXES password",
  "change-email": "Confirm your NULLXES email change",
};

function buildOtpEmailHtml(otp: string): string {
  return `
    <p>Your verification code is:</p>
    <p style="font-size: 24px; font-weight: 600; letter-spacing: 0.2em;">${otp}</p>
    <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
  `.trim();
}

export type SendVerificationOtpResult = {
  sent: boolean;
  error?: string;
};

/**
 * Sends OTP email via Resend and waits for the provider response.
 * Used by the custom post-login OTP step-up flow.
 */
export async function sendVerificationOtpEmailAwaited(input: {
  email: string;
  otp: string;
  type: OtpEmailType;
}): Promise<SendVerificationOtpResult> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY is not configured." };
  }

  try {
    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [input.email],
      subject: SUBJECTS[input.type],
      html: buildOtpEmailHtml(input.otp),
    });

    if (error) {
      const message =
        typeof error.message === "string" ? error.message : "Resend rejected the send.";
      console.error(`[email-otp] Resend failed for ${input.email}:`, message);
      return { sent: false, error: message };
    }

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email-otp] Resend failed for ${input.email}:`, message);
    return { sent: false, error: message };
  }
}

/**
 * Fire-and-forget OTP send for Better Auth plugin callbacks.
 * Better Auth recommends not awaiting to reduce timing-attack surface.
 */
export function sendVerificationOtpEmail(input: {
  email: string;
  otp: string;
  type: OtpEmailType;
}): void {
  void sendVerificationOtpEmailAwaited(input).then((result) => {
    if (!result.sent && result.error) {
      console.error(
        `[email-otp] Background OTP send failed for ${input.email}:`,
        result.error,
      );
    }
  });
}
