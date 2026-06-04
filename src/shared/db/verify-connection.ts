import { sql } from "drizzle-orm";
import { db } from "./client";
import { platformMetadata } from "./schema";

async function verifyConnection(): Promise<void> {
  const versionResult = await db.execute(sql`SELECT version()`);
  const versionRow = versionResult.rows[0] as { version?: string } | undefined;
  const version = versionRow?.version ?? "unknown";

  await db.select().from(platformMetadata).limit(1);

  console.log("Database connection: OK");
  console.log(`PostgreSQL version: ${version}`);
  console.log("platform_metadata table: accessible");
}

verifyConnection().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Database verification failed:", message);
  process.exit(1);
});
