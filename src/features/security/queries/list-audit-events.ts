import { and, count, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { auditEvent } from "@/entities/audit/schema";
import { withTenantContext } from "@/shared/db/with-tenant-context";

export type AuditEventRow = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorRole: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
};

export type ListAuditEventsResult = {
  events: AuditEventRow[];
  total: number;
};

export async function listAuditEvents(input: {
  organizationId: string;
  limit?: number;
  offset?: number;
  search?: string;
  from?: Date;
  to?: Date;
}): Promise<ListAuditEventsResult> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  const search = input.search?.trim();

  return withTenantContext(input.organizationId, async (tx) => {
    const filters = [eq(auditEvent.organizationId, input.organizationId)];

    if (search) {
      filters.push(ilike(auditEvent.action, `%${search}%`));
    }

    if (input.from) {
      filters.push(gte(auditEvent.createdAt, input.from));
    }

    if (input.to) {
      filters.push(lte(auditEvent.createdAt, input.to));
    }

    const whereClause = and(...filters);

    const [totalRow, events] = await Promise.all([
      tx.select({ total: count() }).from(auditEvent).where(whereClause),
      tx
        .select({
          id: auditEvent.id,
          action: auditEvent.action,
          actorUserId: auditEvent.actorUserId,
          actorRole: auditEvent.actorRole,
          resourceType: auditEvent.resourceType,
          resourceId: auditEvent.resourceId,
          metadata: auditEvent.metadata,
          ipAddress: auditEvent.ipAddress,
          createdAt: auditEvent.createdAt,
        })
        .from(auditEvent)
        .where(whereClause)
        .orderBy(desc(auditEvent.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return {
      events,
      total: Number(totalRow[0]?.total ?? 0),
    };
  });
}
