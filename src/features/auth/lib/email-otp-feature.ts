/**
 * Post-login email OTP step-up (Better Auth emailOTP plugin).
 *
 * Enabled per environment. Production can turn this on after
 * www.nullxesdai.online is Verified in Resend → Domains:
 *   EMAIL_OTP_STEP_UP_ENABLED=true
 */
export function isEmailOtpStepUpEnabled(): boolean {
  return process.env.EMAIL_OTP_STEP_UP_ENABLED?.trim() === "true";
}
