"use server";

import { eq } from "drizzle-orm";
import type { AuditAction } from "@/entities/audit/schema";
import { membership } from "@/entities/membership/schema";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { db } from "@/shared/db/client";

const TWO_FACTOR_AUDIT_ACTIONS = [
  "security.2fa.enabled",
  "security.2fa.disabled",
  "security.2fa.failed_attempt",
  "security.backup_codes.generated",
  "security.trusted_device.created",
] as const satisfies readonly AuditAction[];

export type TwoFactorAuditAction = (typeof TWO_FACTOR_AUDIT_ACTIONS)[number];

export type RecordTwoFactorAuditInput = {
  action: TwoFactorAuditAction;
  metadata?: Record<string, unknown>;
};

/**
 * Best-effort audit for Better Auth 2FA client flows.
 * Resolves workspace when possible; no-ops if the caller has no org yet.
 */
export async function recordTwoFactorAuditAction(
  input: RecordTwoFactorAuditInput,
): Promise<void> {
  if (!TWO_FACTOR_AUDIT_ACTIONS.includes(input.action)) {
    return;
  }

  try {
    const session = await getCurrentSession();
    if (!session?.user?.id) {
      return;
    }

    try {
      const workspace = await ensureWorkspace(
        session.user.id,
        session.user.name ?? "",
      );
      recordAuditEvent({
        organizationId: workspace.organization.id,
        actorUserId: session.user.id,
        actorRole: workspace.membership.role,
        action: input.action,
        resourceType: "user",
        resourceId: session.user.id,
        metadata: input.metadata,
      });
      return;
    } catch {
      // Mid-login 2FA challenge may not have a provisioned workspace yet.
    }

    const [row] = await db
      .select({
        organizationId: membership.organizationId,
        role: membership.role,
      })
      .from(membership)
      .where(eq(membership.userId, session.user.id))
      .limit(1);

    if (!row) {
      return;
    }

    recordAuditEvent({
      organizationId: row.organizationId,
      actorUserId: session.user.id,
      actorRole: row.role,
      action: input.action,
      resourceType: "user",
      resourceId: session.user.id,
      metadata: input.metadata,
    });
  } catch {
    // Audit must never block auth UX.
  }
}
