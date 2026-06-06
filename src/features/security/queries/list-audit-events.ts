import { desc, eq } from "drizzle-orm";
import { auditEvent } from "@/entities/audit/schema";
import { db } from "@/shared/db/client";

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

export async function listAuditEvents(input: {
  organizationId: string;
  limit?: number;
}): Promise<AuditEventRow[]> {
  const limit = input.limit ?? 50;

  return db
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
    .where(eq(auditEvent.organizationId, input.organizationId))
    .orderBy(desc(auditEvent.createdAt))
    .limit(limit);
}
