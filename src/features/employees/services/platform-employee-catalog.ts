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
  return (await getPublishedCatalogHomeOrganizationId(employeeId)) !== null;
}

/** Home org that owns a published catalog employee, or null if not in catalog. */
export async function getPublishedCatalogHomeOrganizationId(
  employeeId: string,
): Promise<string | null> {
  const [row] = await db
    .select({
      homeOrganizationId: digitalEmployee.organizationId,
    })
    .from(platformEmployeeCatalog)
    .innerJoin(
      digitalEmployee,
      eq(digitalEmployee.id, platformEmployeeCatalog.employeeId),
    )
    .where(
      and(
        eq(platformEmployeeCatalog.employeeId, employeeId),
        eq(platformEmployeeCatalog.isPublished, true),
      ),
    )
    .limit(1);

  return row?.homeOrganizationId ?? null;
}

export const CATALOG_IMMUTABLE_MESSAGE =
  "NULLXES catalog employees are read-only. Create a custom digital employee to edit your own workforce.";

/**
 * Published Platform Catalog employees are read-only for other tenants.
 * The home organization (ceo / catalog publisher) retains full write access.
 * Talk/sessions are intentionally not gated here.
 */
export async function assertCatalogEmployeeImmutable(
  employeeId: string,
  callerOrganizationId?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const homeOrganizationId =
    await getPublishedCatalogHomeOrganizationId(employeeId);
  if (!homeOrganizationId) {
    return { ok: true };
  }

  if (
    callerOrganizationId &&
    callerOrganizationId === homeOrganizationId
  ) {
    return { ok: true };
  }

  return { ok: false, message: CATALOG_IMMUTABLE_MESSAGE };
}

/** Alias kept for existing action call sites. */
export async function assertNotPlatformCatalogEmployee(
  employeeId: string,
  callerOrganizationId?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  return assertCatalogEmployeeImmutable(employeeId, callerOrganizationId);
}

export class CatalogEmployeeImmutableError extends Error {
  readonly status = 403;

  constructor(message = CATALOG_IMMUTABLE_MESSAGE) {
    super(message);
    this.name = "CatalogEmployeeImmutableError";
  }
}

export async function forbidCatalogMutation(
  employeeId: string,
  callerOrganizationId?: string,
): Promise<void> {
  const guard = await assertCatalogEmployeeImmutable(
    employeeId,
    callerOrganizationId,
  );
  if (!guard.ok) {
    throw new CatalogEmployeeImmutableError(guard.message);
  }
}

/**
 * Writable when the employee belongs to organizationId.
 * Catalog publication does not block the home org.
 */
export async function assertEmployeeWritableInOrg(
  organizationId: string,
  employeeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const catalogGuard = await assertCatalogEmployeeImmutable(
    employeeId,
    organizationId,
  );
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
