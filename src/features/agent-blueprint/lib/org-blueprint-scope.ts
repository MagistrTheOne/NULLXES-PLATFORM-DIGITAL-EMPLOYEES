import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export function orgOrSystemScope(
  organizationId: string,
  organizationColumn: PgColumn,
): ReturnType<typeof and> {
  return or(
    eq(organizationColumn, organizationId),
    isNull(organizationColumn),
  )!;
}

export function systemTemplateOnly(column: PgColumn) {
  return sql`${column} IS NULL`;
}
