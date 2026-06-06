import { sql } from "drizzle-orm";
import { db } from "@/shared/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    await db.execute(sql`select 1 as ok`);
    return Response.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";

    return Response.json({ ok: false, message }, { status: 500 });
  }
}
