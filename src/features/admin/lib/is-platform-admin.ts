const DEFAULT_PLATFORM_ADMIN_EMAILS = ["ceo@nullxes.com"] as const;

function parsePlatformAdminEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Platform admins: always `ceo@nullxes.com`, plus `PLATFORM_ADMIN_EMAILS`.
 * Used for Anam Key pool UI and other operator-only surfaces.
 */
export function getPlatformAdminEmails(): string[] {
  const fromEnv = parsePlatformAdminEmails(process.env.PLATFORM_ADMIN_EMAILS);
  return Array.from(
    new Set([...DEFAULT_PLATFORM_ADMIN_EMAILS, ...fromEnv]),
  );
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  return getPlatformAdminEmails().includes(normalized);
}
