function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(/[,;\s]+/)
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

/**
 * Temporary bypass for org admin 2FA enforcement gate.
 * Does not remove 2FA code — only skips the dashboard redirect to
 * /settings?tab=security&require2fa=1 for listed emails.
 *
 * Set `TWO_FACTOR_GATE_BYPASS_EMAILS` (comma-separated), e.g. acquiring auditor.
 */
export function shouldBypassAdminTwoFactorGate(email: string): boolean {
  const configured = parseEmailList(process.env.TWO_FACTOR_GATE_BYPASS_EMAILS);
  if (configured.length === 0) {
    return false;
  }
  return configured.includes(normalizeEmail(email));
}
