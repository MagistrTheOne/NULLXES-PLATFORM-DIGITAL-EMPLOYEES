import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import type {
  AvatarProviderConfigPayload,
  SessionProviderConfigPayload,
} from "@/entities/provider-config";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { organization } from "@/entities/organization/schema";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { knowledgeSource } from "@/entities/knowledge/schema";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { planAllowsCreateEmployees } from "@/features/billing/lib/plan-capabilities";
import { db } from "@/shared/db/client";
import { withDatabaseRetry } from "@/shared/db/with-database-retry";
import { isAnamAvatarTalkReady } from "../lib/resolve-anam-avatar-talk-readiness";
import { readProviderFailureReason } from "../lib/resolve-talk-readiness";
import type { EmployeeListItem } from "../types";
import { listPublishedPlatformCatalog } from "./platform-employee-catalog";

const DEFAULT_PAGE_SIZE = 24;

export type EmployeeListPage = {
  items: EmployeeListItem[];
  nextCursor: string | null;
};

function readProvisioningStatus(
  value: unknown,
): EmployeeListItem["avatarProvisioningStatus"] {
  if (
    value === "pending" ||
    value === "provisioning" ||
    value === "ready" ||
    value === "failed"
  ) {
    return value;
  }

  return "pending";
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = decoded.split("|");
    if (!createdAt || !id) {
      return null;
    }

    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return { createdAt: parsed, id };
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString(
    "base64url",
  );
}

async function hydrateEmployeeListItems(
  pageRows: Array<typeof digitalEmployee.$inferSelect>,
  source: "organization" | "platform",
): Promise<EmployeeListItem[]> {
  if (pageRows.length === 0) {
    return [];
  }

  const employeeIds = pageRows.map((employee) => employee.id);

  let knowledgeCounts: Array<{
    employeeId: string;
    knowledgeSourcesCount: number;
  }> = [];
  let providerConfigs: Array<{
    employeeId: string;
    providerType: string;
    config: unknown;
  }> = [];

  try {
    [knowledgeCounts, providerConfigs] = await withDatabaseRetry(() =>
      Promise.all([
        db
          .select({
            employeeId: knowledgeSource.employeeId,
            knowledgeSourcesCount: sql<number>`cast(count(*) as int)`.mapWith(
              Number,
            ),
          })
          .from(knowledgeSource)
          .where(inArray(knowledgeSource.employeeId, employeeIds))
          .groupBy(knowledgeSource.employeeId),
        db
          .select()
          .from(employeeProviderConfig)
          .where(inArray(employeeProviderConfig.employeeId, employeeIds)),
      ]),
    );
  } catch {
    // Ignore transient failures for augmentation data.
  }

  const countByEmployeeId = new Map(
    knowledgeCounts.map((row) => [row.employeeId, row.knowledgeSourcesCount]),
  );

  const avatarConfigByEmployee = new Map<string, AvatarProviderConfigPayload>();
  const sessionConfigByEmployee = new Map<
    string,
    SessionProviderConfigPayload
  >();

  for (const row of providerConfigs) {
    if (row.providerType === "avatar") {
      avatarConfigByEmployee.set(
        row.employeeId,
        row.config as AvatarProviderConfigPayload,
      );
    }

    if (row.providerType === "session") {
      sessionConfigByEmployee.set(
        row.employeeId,
        row.config as SessionProviderConfigPayload,
      );
    }
  }

  return pageRows.map((employee) => {
    const avatarConfig = avatarConfigByEmployee.get(employee.id);
    const sessionConfig = sessionConfigByEmployee.get(employee.id);
    const avatarProvisioningStatus = readProvisioningStatus(
      avatarConfig?.provisioningStatus,
    );
    const sessionProvisioningStatus = readProvisioningStatus(
      sessionConfig?.provisioningStatus,
    );
    const avatarReady = isAnamAvatarTalkReady(avatarConfig);
    const sessionReady = sessionProvisioningStatus === "ready";

    return {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      status: employee.status,
      avatarProvider: employee.avatarProvider,
      brainProvider: employee.brainProvider,
      knowledgeSourcesCount: countByEmployeeId.get(employee.id) ?? 0,
      createdAt: employee.createdAt,
      avatarPreviewUrl: avatarConfig?.previewUrl ?? null,
      avatarProvisioningStatus,
      sessionProvisioningStatus,
      avatarProvisioningFailureReason: readProviderFailureReason(
        avatarConfig as Record<string, unknown> | undefined,
      ),
      sessionProvisioningFailureReason: readProviderFailureReason(
        sessionConfig as Record<string, unknown> | undefined,
      ),
      sessionVoiceProvider: sessionConfig?.voiceProvider ?? null,
      canTalk: avatarReady && sessionReady,
      source,
    };
  });
}

export async function listOrganizationEmployees(
  organizationId: string,
  options?: { cursor?: string; limit?: number },
): Promise<EmployeeListPage> {
  return withDatabaseRetry(() =>
    loadOrganizationEmployeesPage(organizationId, options),
  );
}

/** Cursor that yields the full org list (desc) after a catalog-only first page. */
const ORG_LIST_START_CURSOR = encodeCursor(
  new Date("9999-12-31T23:59:59.999Z"),
  "ffffffff-ffff-ffff-ffff-ffffffffffff",
);

async function loadPublishedCatalogItems(): Promise<EmployeeListItem[]> {
  const catalog = await listPublishedPlatformCatalog();
  if (catalog.length === 0) {
    return [];
  }

  const catalogEmployees = await db
    .select()
    .from(digitalEmployee)
    .where(
      inArray(
        digitalEmployee.id,
        catalog.map((entry) => entry.employeeId),
      ),
    );

  const byId = new Map(
    catalogEmployees.map((employee) => [employee.id, employee]),
  );
  const ordered = catalog
    .map((entry) => byId.get(entry.employeeId))
    .filter((employee): employee is NonNullable<typeof employee> =>
      Boolean(employee),
    );

  return hydrateEmployeeListItems(ordered, "platform");
}

async function loadOrganizationEmployeesPage(
  organizationId: string,
  options?: { cursor?: string; limit?: number },
): Promise<EmployeeListPage> {
  const limit = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE_SIZE, 1), 100);
  const cursor = options?.cursor ? decodeCursor(options.cursor) : null;

  const [org] = await db
    .select({ billingPlan: organization.billingPlan })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  const planId = resolveBillingPlanId(org?.billingPlan ?? "free");
  const includePlatformCatalog = !planAllowsCreateEmployees(planId);

  // First page only: catalog occupies slots first so total items never exceed limit.
  let catalogItems: EmployeeListItem[] = [];
  if (includePlatformCatalog && !cursor) {
    const allCatalog = await loadPublishedCatalogItems();
    catalogItems = allCatalog.slice(0, limit);
  }

  const orgSlots = limit - catalogItems.length;

  if (orgSlots === 0) {
    const [orgHead] = await db
      .select({ id: digitalEmployee.id })
      .from(digitalEmployee)
      .where(eq(digitalEmployee.organizationId, organizationId))
      .limit(1);

    return {
      items: catalogItems,
      nextCursor: orgHead ? ORG_LIST_START_CURSOR : null,
    };
  }

  const employees = await db
    .select()
    .from(digitalEmployee)
    .where(
      and(
        eq(digitalEmployee.organizationId, organizationId),
        cursor
          ? or(
              lt(digitalEmployee.createdAt, cursor.createdAt),
              and(
                eq(digitalEmployee.createdAt, cursor.createdAt),
                lt(digitalEmployee.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(digitalEmployee.createdAt), desc(digitalEmployee.id))
    .limit(orgSlots + 1);

  const pageRows = employees.slice(0, orgSlots);
  const hasMore = employees.length > orgSlots;
  const orgItems = await hydrateEmployeeListItems(pageRows, "organization");
  const items = [...catalogItems, ...orgItems];
  const last = pageRows[pageRows.length - 1];

  return {
    items,
    nextCursor:
      hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}
