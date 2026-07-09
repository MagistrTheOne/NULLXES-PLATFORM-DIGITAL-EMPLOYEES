function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

/**
 * Post-login email OTP bypass allowlist.
 * Set `EMAIL_OTP_BYPASS_EMAILS` (comma-separated) to skip the one-time gate.
 * Falls back to `PLATFORM_ADMIN_EMAILS`, then `ceo@nullxes.com` for the founder account.
 */
export function shouldBypassEmailOtp(email: string): boolean {
  const configured = parseEmailList(process.env.EMAIL_OTP_BYPASS_EMAILS);
  if (configured.length > 0) {
    return configured.includes(normalizeEmail(email));
  }

  const platformAdmins = parseEmailList(process.env.PLATFORM_ADMIN_EMAILS);
  if (platformAdmins.length > 0) {
    return platformAdmins.includes(normalizeEmail(email));
  }

  return normalizeEmail(email) === "ceo@nullxes.com";
}
