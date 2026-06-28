/**
 * Post-login email OTP step-up (Better Auth emailOTP plugin).
 *
 * Disabled until Resend domain DNS is verified. Enable in Vercel when
 * nullxesdai.online shows "Verified" in Resend → Domains:
 *   EMAIL_OTP_STEP_UP_ENABLED=true
 */
export function isEmailOtpStepUpEnabled(): boolean {
  return process.env.EMAIL_OTP_STEP_UP_ENABLED?.trim() === "true";
}
