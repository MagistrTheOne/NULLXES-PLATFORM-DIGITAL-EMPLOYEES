/**
 * Hard-delete legacy shared Stream channels (`employee-talk-{employeeId}`).
 * Safe to re-run; missing channels are ignored.
 *
 * Usage: npm run stream:purge-legacy-talk
 */
import { eq } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { platformEmployeeCatalog } from "@/entities/platform-employee-catalog/schema";
import { purgeLegacySharedTalkChannels } from "@/features/privacy/services/purge-stream-channels";
import { db } from "@/shared/db/client";

async function main(): Promise<void> {
  const catalog = await db
    .select({ employeeId: platformEmployeeCatalog.employeeId })
    .from(platformEmployeeCatalog)
    .where(eq(platformEmployeeCatalog.isPublished, true));

  const owned = await db.select({ id: digitalEmployee.id }).from(digitalEmployee);

  const employeeIds = [
    ...new Set([
      ...catalog.map((row) => row.employeeId),
      ...owned.map((row) => row.id),
    ]),
  ];

  console.log(`Purging legacy Talk channels for ${employeeIds.length} employees…`);
  const result = await purgeLegacySharedTalkChannels(employeeIds);
  console.log(`Deleted (or attempted) ${result.purgedChannels} legacy channels.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
