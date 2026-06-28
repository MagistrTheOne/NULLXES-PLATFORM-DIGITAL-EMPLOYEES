import { sendNotificationEmail } from "@/shared/email/send-notification-email";

export async function sendEmailOtpMessage(input: {
  email: string;
  code: string;
}): Promise<{ sent: boolean }> {
  const result = await sendNotificationEmail({
    to: [input.email],
    subject: "Your NULLXES verification code",
    html: `
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: 600; letter-spacing: 0.2em;">${input.code}</p>
      <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
    `.trim(),
  });

  if (!result.sent && process.env.NODE_ENV === "development") {
    console.info(
      `[email-otp] Dev fallback — code for ${input.email}: ${input.code}`,
    );
  }

  return { sent: result.sent };
}
