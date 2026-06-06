import { headers } from "next/headers";
import type { AuditAction } from "@/entities/audit/schema";
import { auditEvent } from "@/entities/audit/schema";
import { db } from "@/shared/db/client";

export type RecordAuditEventInput = {
  organizationId: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

async function resolveRequestContext(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for");
    const ipAddress =
      forwarded?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      null;

    return {
      ipAddress,
      userAgent: requestHeaders.get("user-agent"),
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

export function recordAuditEvent(input: RecordAuditEventInput): void {
  void (async () => {
    const requestContext = await resolveRequestContext();

    await db.insert(auditEvent).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? requestContext.ipAddress,
      userAgent: input.userAgent ?? requestContext.userAgent,
    });
  })().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to record audit event:", message);
  });
}
