/**
 * Orgs created by local verify/probe scripts — not real tenants.
 * Used for platform analytics filtering and cleanup scripts.
 */
const EPHEMERAL_ORG_NAME_PATTERNS: RegExp[] = [
  /\bverify\b/i,
  /\bprobe\b/i,
  /^NULLXES Workspace (Primary|Secondary)$/i,
  /^NULLXES Rollback Org$/i,
  /^NULLXES Orchestration Org$/i,
  /^Persist Create Employee Org$/i,
  /^Dashboard Shell Verify/i,
  /^Employees UI Verify/i,
  /^Auth Experience Verify/i,
  /^Blueprint Verify\b/i,
  /^Public API (Probe|Verify) Org$/i,
];

export function isEphemeralVerifyOrganizationName(
  name: string | null | undefined,
): boolean {
  if (!name?.trim()) {
    return false;
  }

  return EPHEMERAL_ORG_NAME_PATTERNS.some((pattern) => pattern.test(name));
}
