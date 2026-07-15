/**
 * Stream Chat channel ids for Talk.
 *
 * Main channels are private per (employee, user) — never shared across users
 * or orgs (catalog employees included). Named threads keep the et- prefix and
 * are already membership-filtered.
 *
 * Stream channel id max length is 64; UUIDs are compacted (no hyphens, 16 hex).
 */

function compactId(id: string, length = 16): string {
  return id.replace(/-/g, "").slice(0, length);
}

/** Stream channel id for a talk thread. Main (null thread) is user-private. */
export function talkChannelId(
  employeeId: string,
  threadId?: string | null,
  actorUserId?: string,
): string {
  if (threadId) {
    return `et-${employeeId}-${threadId}`;
  }

  if (!actorUserId) {
    throw new Error("actorUserId is required for the main Talk channel");
  }

  return `etu-${compactId(employeeId)}-${compactId(actorUserId)}`;
}

export function digitalEmployeeChatUserId(employeeId: string): string {
  return `digital-employee-${employeeId}`;
}

/** Legacy shared main channel (pre-isolation). Kept for retention purge only. */
export function legacySharedTalkChannelId(employeeId: string): string {
  return `employee-talk-${employeeId}`;
}
