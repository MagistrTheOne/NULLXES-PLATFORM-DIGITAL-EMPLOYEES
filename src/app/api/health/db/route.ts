import { sql } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { timingSafeStringEqual } from "@/shared/crypto/timing-safe-compare";

export const runtime = "nodejs";

function isAuthorizedHealthRequest(request: Request): boolean {
  const expected = process.env.HEALTH_CHECK_TOKEN?.trim();
  if (!expected) {
    return true;
  }

  const headerToken = request.headers.get("x-health-token")?.trim();
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  return (
    timingSafeStringEqual(headerToken, expected) ||
    timingSafeStringEqual(bearerToken, expected)
  );
}

export async function GET(request: Request) {
  if (!isAuthorizedHealthRequest(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    await db.execute(sql`select 1 as ok`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
