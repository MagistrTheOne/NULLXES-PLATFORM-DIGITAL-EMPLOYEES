/** Post-login email OTP step-up (custom flow, not Better Auth emailOTP plugin). */
export function isEmailOtpStepUpEnabled(): boolean {
  return process.env.EMAIL_OTP_STEP_UP_ENABLED?.trim() === "true";
}
