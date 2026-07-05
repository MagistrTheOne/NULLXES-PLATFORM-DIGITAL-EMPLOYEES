import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { sql } from "drizzle-orm";
import { db } from "@/shared/db/client";

loadEnvFiles();

async function main() {
  const migrationPath = join(
    process.cwd(),
    "drizzle",
    "0030_flashy_pestilence.sql",
  );
  const raw = readFileSync(migrationPath, "utf8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    console.log("Running:", statement.slice(0, 80).replace(/\s+/g, " "), "...");
    await db.execute(sql.raw(statement));
  }

  const check = await db.execute(
    sql`SELECT to_regclass('public.character_preset') as table_name`,
  );
  console.log("character_preset after repair:", check.rows);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
