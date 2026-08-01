import { and, isNotNull, lt, or } from "drizzle-orm";
import { exportJob } from "@/entities/export-job/schema";
import { db } from "@/shared/db/client";

/** Clear encrypted payloads after download expiry (24h) or after 7 days. */
export async function purgeExpiredExportJobs(): Promise<{ purged: number }> {
  const now = new Date();
  const staleCreatedAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const updated = await db
    .update(exportJob)
    .set({
      payloadPath: null,
      downloadToken: null,
    })
    .where(
      and(
        isNotNull(exportJob.payloadPath),
        or(
          and(
            isNotNull(exportJob.downloadExpiresAt),
            lt(exportJob.downloadExpiresAt, now),
          ),
          lt(exportJob.createdAt, staleCreatedAt),
        ),
      ),
    )
    .returning({ id: exportJob.id });

  return { purged: updated.length };
}
