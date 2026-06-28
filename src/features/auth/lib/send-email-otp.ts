import { isDevelopmentRuntime } from "@/shared/config/env";
import { sendVerificationOtpEmail } from "@/shared/email/send-verification-otp-email";

export async function sendEmailOtpMessage(input: {
  email: string;
  code: string;
}): Promise<{ sent: boolean }> {
  sendVerificationOtpEmail({
    email: input.email,
    otp: input.code,
    type: "email-verification",
  });

  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());

  if (!hasResend && isDevelopmentRuntime()) {
    console.info(
      `[email-otp] Dev fallback — code for ${input.email}: ${input.code}`,
    );
  }

  return { sent: hasResend };
}
