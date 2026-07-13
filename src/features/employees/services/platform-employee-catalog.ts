import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import type { BillingPlanId } from "@/features/billing/config/plans";
import {
  filterEmployeeIdsByCatalogAccess,
  planPlatformCatalogAccess,
} from "@/features/billing/lib/platform-catalog-access";
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

/** Published catalog entries visible for a billing plan. */
export async function listPublishedPlatformCatalogForPlan(
  planId: BillingPlanId,
): Promise<PlatformCatalogEntry[]> {
  const catalog = await listPublishedPlatformCatalog();
  const access = planPlatformCatalogAccess(planId);
  const allowedIds = new Set(
    filterEmployeeIdsByCatalogAccess(
      catalog.map((entry) => entry.employeeId),
      access,
    ),
  );
  return catalog.filter((entry) => allowedIds.has(entry.employeeId));
}

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
        "NULLXES catalog employees are read-only. Create a custom digital employee to edit your own workforce.",
    };
  }

  return { ok: true };
}

/** Whether a published catalog employee is visible on this plan. */
export async function isPlatformCatalogEmployeeVisibleToPlan(
  employeeId: string,
  planId: BillingPlanId,
): Promise<boolean> {
  if (!(await isPublishedPlatformCatalogEmployee(employeeId))) {
    return false;
  }

  const allowed = filterEmployeeIdsByCatalogAccess(
    [employeeId],
    planPlatformCatalogAccess(planId),
  );
  return allowed.includes(employeeId);
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
