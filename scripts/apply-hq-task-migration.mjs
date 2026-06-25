import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const raw = readFileSync("drizzle/0020_hq_task.sql", "utf8");
const statements = raw
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0);

for (const statement of statements) {
  await sql.query(statement);
  console.log("ok:", statement.replace(/\s+/g, " ").slice(0, 64));
}

console.log("hq_task migration applied");
