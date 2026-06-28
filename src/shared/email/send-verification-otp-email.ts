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

/**
 * Sends OTP email via Resend. Used by Better Auth emailOTP plugin.
 * Intentionally fire-and-forget per Better Auth timing-attack guidance.
 */
export function sendVerificationOtpEmail(input: {
  email: string;
  otp: string;
  type: OtpEmailType;
}): void {
  const resend = getResendClient();
  if (!resend) {
    console.error(
      `[email-otp] RESEND_API_KEY missing — OTP not sent to ${input.email}`,
    );
    return;
  }

  void resend.emails
    .send({
      from: getResendFromAddress(),
      to: [input.email],
      subject: SUBJECTS[input.type],
      html: `
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: 600; letter-spacing: 0.2em;">${input.otp}</p>
        <p>This code expires in 10 minutes. If you did not request it, ignore this email.</p>
      `.trim(),
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[email-otp] Resend failed for ${input.email}:`, message);
    });
}
