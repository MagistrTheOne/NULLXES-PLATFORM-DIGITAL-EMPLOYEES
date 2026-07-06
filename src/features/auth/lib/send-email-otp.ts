import { isDevelopmentRuntime } from "@/shared/config/env";
import { sendPostLoginOtpEmail } from "@/shared/email/auth-transactional-email";
import { DEFAULT_LOCALE } from "@/i18n/config";

export async function sendEmailOtpMessage(input: {
  email: string;
  code: string;
  locale?: "en" | "ru";
}): Promise<{ sent: boolean; error?: string }> {
  const delivery = await sendPostLoginOtpEmail({
    email: input.email,
    otp: input.code,
    locale: input.locale ?? DEFAULT_LOCALE,
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
