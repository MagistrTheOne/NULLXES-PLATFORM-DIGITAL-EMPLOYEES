const DEFAULT_PLATFORM_ADMIN_EMAILS = ["ceo@nullxes.com"];

function getPlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) {
    return DEFAULT_PLATFORM_ADMIN_EMAILS;
  }

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  return getPlatformAdminEmails().includes(normalized);
}
