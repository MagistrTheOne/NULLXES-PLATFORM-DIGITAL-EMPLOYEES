/**
 * Apply Drizzle SQL migrations over Neon HTTP.
 *
 * Prefer this over `drizzle-kit migrate`: the kit CLI uses the Neon WebSocket
 * driver and on Windows often exits with code 1 while hiding the real error
 * (spinner only / "No config path provided" noise). HTTP migrator prints
 * failures and does not need a `server-only` mock.
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

function sanitizeEnvValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

async function loadProjectEnv() {
  const { loadEnvFiles } = await import(
    pathToFileURL(resolve("src/shared/config/load-env-files.ts")).href
  );
  loadEnvFiles();
}

async function main() {
  await loadProjectEnv();

  const url = sanitizeEnvValue(process.env.DATABASE_URL);
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  if (!url.startsWith("postgres")) {
    console.error(
      "DATABASE_URL must start with postgresql:// (check wrapping quotes in .env)",
    );
    process.exit(1);
  }

  const migrationsFolder = resolve("drizzle");
  console.log("Migrating via Neon HTTP…");
  console.log(`Migrations folder: ${migrationsFolder}`);

  const sql = neon(url);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Migration failed:", message);
  if (error instanceof Error && error.cause) {
    console.error("Cause:", error.cause);
  }
  process.exit(1);
});
