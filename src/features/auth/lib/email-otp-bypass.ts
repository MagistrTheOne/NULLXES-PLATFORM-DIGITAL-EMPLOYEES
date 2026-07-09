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
 * Production: set `EMAIL_OTP_BYPASS_EMAILS` (comma-separated). Empty = no bypass.
 * Development: falls back to PLATFORM_ADMIN_EMAILS, then a local-only default.
 */
export function shouldBypassEmailOtp(email: string): boolean {
  const configured = parseEmailList(process.env.EMAIL_OTP_BYPASS_EMAILS);
  if (configured.length > 0) {
    return configured.includes(normalizeEmail(email));
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const platformAdmins = parseEmailList(process.env.PLATFORM_ADMIN_EMAILS);
  if (platformAdmins.length > 0) {
    return platformAdmins.includes(normalizeEmail(email));
  }

  return normalizeEmail(email) === "ceo@nullxes.com";
}
