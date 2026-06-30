"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { listAuditEvents } from "@/features/security/queries/list-audit-events";

export async function searchAuditEventsAction(input: {
  search?: string;
  from?: string;
  to?: string;
  offset?: number;
  limit?: number;
}): Promise<
  | {
      ok: true;
      events: Array<{
        id: string;
        action: string;
        actorUserId: string | null;
        actorRole: string | null;
        resourceType: string | null;
        resourceId: string | null;
        createdAt: Date;
      }>;
      total: number;
    }
  | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "You do not have permission to view audit events." };
  }

  const from = input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined;
  const to = input.to ? new Date(`${input.to}T23:59:59.999Z`) : undefined;

  if (from && Number.isNaN(from.getTime())) {
    return { ok: false, message: "Invalid start date." };
  }

  if (to && Number.isNaN(to.getTime())) {
    return { ok: false, message: "Invalid end date." };
  }

  const result = await listAuditEvents({
    organizationId: workspace.organization.id,
    search: input.search,
    from,
    to,
    offset: input.offset,
    limit: input.limit,
  });

  return {
    ok: true,
    events: result.events.map((event) => ({
      id: event.id,
      action: event.action,
      actorUserId: event.actorUserId,
      actorRole: event.actorRole,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      createdAt: event.createdAt,
    })),
    total: result.total,
  };
}
