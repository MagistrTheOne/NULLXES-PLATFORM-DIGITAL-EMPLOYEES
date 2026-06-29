const OTP_BYPASS_EMAILS = new Set(["ceo@nullxes.com"]);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Post-login email OTP is skipped for platform admin allowlist emails. */
export function shouldBypassEmailOtp(email: string): boolean {
  return OTP_BYPASS_EMAILS.has(normalizeEmail(email));
}
