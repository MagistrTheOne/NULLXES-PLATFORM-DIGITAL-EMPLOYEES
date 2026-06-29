import { isDevelopmentRuntime } from "@/shared/config/env";
import { sendVerificationOtpEmailAwaited } from "@/shared/email/send-verification-otp-email";

export async function sendEmailOtpMessage(input: {
  email: string;
  code: string;
}): Promise<{ sent: boolean; error?: string }> {
  const delivery = await sendVerificationOtpEmailAwaited({
    email: input.email,
    otp: input.code,
    type: "email-verification",
  });

  if (delivery.sent) {
    return { sent: true };
  }

  if (isDevelopmentRuntime()) {
    console.info(
      `[email-otp] Dev fallback — code for ${input.email}: ${input.code}`,
    );
    return { sent: false, error: delivery.error };
  }

  return { sent: false, error: delivery.error };
}
