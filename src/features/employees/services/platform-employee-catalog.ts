import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { platformEmployeeCatalog } from "@/entities/platform-employee-catalog/schema";
import { db } from "@/shared/db/client";

export type PlatformCatalogEntry = {
  employeeId: string;
  sortOrder: number;
  homeOrganizationId: string;
};

export const listPublishedPlatformCatalog = cache(
  async (): Promise<PlatformCatalogEntry[]> => {
    const rows = await db
      .select({
        employeeId: platformEmployeeCatalog.employeeId,
        sortOrder: platformEmployeeCatalog.sortOrder,
        homeOrganizationId: digitalEmployee.organizationId,
      })
      .from(platformEmployeeCatalog)
      .innerJoin(
        digitalEmployee,
        eq(digitalEmployee.id, platformEmployeeCatalog.employeeId),
      )
      .where(eq(platformEmployeeCatalog.isPublished, true))
      .orderBy(
        asc(platformEmployeeCatalog.sortOrder),
        asc(digitalEmployee.name),
      );

    return rows;
  },
);

export async function isPublishedPlatformCatalogEmployee(
  employeeId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: platformEmployeeCatalog.id })
    .from(platformEmployeeCatalog)
    .where(
      and(
        eq(platformEmployeeCatalog.employeeId, employeeId),
        eq(platformEmployeeCatalog.isPublished, true),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function assertNotPlatformCatalogEmployee(
  employeeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (await isPublishedPlatformCatalogEmployee(employeeId)) {
    return {
      ok: false,
      message:
        "NULLXES beta digital employees are read-only. Upgrade to create and edit your own workforce.",
    };
  }

  return { ok: true };
}

export async function filterPublishedCatalogEmployeeIds(
  employeeIds: string[],
): Promise<Set<string>> {
  if (employeeIds.length === 0) {
    return new Set();
  }

  const rows = await db
    .select({ employeeId: platformEmployeeCatalog.employeeId })
    .from(platformEmployeeCatalog)
    .where(
      and(
        inArray(platformEmployeeCatalog.employeeId, employeeIds),
        eq(platformEmployeeCatalog.isPublished, true),
      ),
    );

  return new Set(rows.map((row) => row.employeeId));
}
