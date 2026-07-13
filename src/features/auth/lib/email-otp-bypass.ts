import { isPlatformAdminEmail } from "@/features/admin/lib/is-platform-admin";

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
 * Otherwise platform admins (`ceo@nullxes.com` + `PLATFORM_ADMIN_EMAILS`) bypass.
 */
export function shouldBypassEmailOtp(email: string): boolean {
  const configured = parseEmailList(process.env.EMAIL_OTP_BYPASS_EMAILS);
  if (configured.length > 0) {
    return configured.includes(normalizeEmail(email));
  }

  return isPlatformAdminEmail(email);
}
