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

export const CATALOG_IMMUTABLE_MESSAGE =
  "NULLXES catalog employees are read-only. Create a custom digital employee to edit your own workforce.";

/**
 * Domain-layer immutability for published Platform Catalog employees.
 * Use on every definition write (CRUD, blueprint, knowledge, missions, tasks, providers).
 * Talk/sessions are intentionally not gated here.
 */
export async function assertCatalogEmployeeImmutable(
  employeeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (await isPublishedPlatformCatalogEmployee(employeeId)) {
    return { ok: false, message: CATALOG_IMMUTABLE_MESSAGE };
  }

  return { ok: true };
}

/** Alias kept for existing action call sites. */
export async function assertNotPlatformCatalogEmployee(
  employeeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  return assertCatalogEmployeeImmutable(employeeId);
}

export class CatalogEmployeeImmutableError extends Error {
  readonly status = 403;

  constructor(message = CATALOG_IMMUTABLE_MESSAGE) {
    super(message);
    this.name = "CatalogEmployeeImmutableError";
  }
}

export async function forbidCatalogMutation(employeeId: string): Promise<void> {
  const guard = await assertCatalogEmployeeImmutable(employeeId);
  if (!guard.ok) {
    throw new CatalogEmployeeImmutableError(guard.message);
  }
}

/**
 * Custom employees only: must belong to organizationId and not be catalog.
 */
export async function assertEmployeeWritableInOrg(
  organizationId: string,
  employeeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const catalogGuard = await assertCatalogEmployeeImmutable(employeeId);
  if (!catalogGuard.ok) {
    return catalogGuard;
  }

  const [row] = await db
    .select({ id: digitalEmployee.id })
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.id, employeeId),
        eq(digitalEmployee.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    return { ok: false, message: "Employee not found" };
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
