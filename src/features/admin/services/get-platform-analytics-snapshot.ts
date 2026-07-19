import { count, desc, eq, ne } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { membership } from "@/entities/membership/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { BILLING_PLANS } from "@/features/billing/config/plans";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { db } from "@/shared/db/client";

const TENANT_ROW_LIMIT = 200;

const PLAN_ORDER: BillingPlanId[] = [
  "free",
  "starter",
  "studio",
  "operator",
  "scale",
  "enterprise",
  "government",
];

export type PlatformPlanMixRow = {
  planId: BillingPlanId;
  planName: string;
  organizationCount: number;
};

export type PlatformTenantRow = {
  organizationId: string;
  organizationName: string;
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
  agentCount: number;
  billingPlan: BillingPlanId;
  billingPlanName: string;
  createdAt: Date;
};

export type PlatformAnalyticsSnapshot = {
  totalUsers: number;
  totalOrganizations: number;
  totalAgents: number;
  paidOrganizations: number;
  planMix: PlatformPlanMixRow[];
  tenants: PlatformTenantRow[];
  tenantsTruncated: boolean;
};

export async function getPlatformAnalyticsSnapshot(): Promise<PlatformAnalyticsSnapshot> {
  const [
    userCountRow,
    orgCountRow,
    agentCountRow,
    paidOrgCountRow,
    planRows,
    memberCountRows,
    agentCountRows,
    ownerRows,
    orgRows,
  ] = await Promise.all([
    db.select({ total: count() }).from(user),
    db.select({ total: count() }).from(organization),
    db.select({ total: count() }).from(digitalEmployee),
    db
      .select({ total: count() })
      .from(organization)
      .where(ne(organization.billingPlan, "free")),
    db
      .select({
        plan: organization.billingPlan,
        total: count(),
      })
      .from(organization)
      .groupBy(organization.billingPlan),
    db
      .select({
        organizationId: membership.organizationId,
        total: count(),
      })
      .from(membership)
      .groupBy(membership.organizationId),
    db
      .select({
        organizationId: digitalEmployee.organizationId,
        total: count(),
      })
      .from(digitalEmployee)
      .groupBy(digitalEmployee.organizationId),
    db
      .select({
        organizationId: membership.organizationId,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(membership)
      .innerJoin(user, eq(membership.userId, user.id))
      .where(eq(membership.role, "owner")),
    db
      .select({
        id: organization.id,
        name: organization.name,
        billingPlan: organization.billingPlan,
        createdAt: organization.createdAt,
      })
      .from(organization)
      .orderBy(desc(organization.createdAt)),
  ]);

  const memberCountByOrg = new Map(
    memberCountRows.map((row) => [row.organizationId, Number(row.total)]),
  );
  const agentCountByOrg = new Map(
    agentCountRows.map((row) => [row.organizationId, Number(row.total)]),
  );
  const ownerByOrg = new Map(
    ownerRows.map((row) => [
      row.organizationId,
      { name: row.ownerName, email: row.ownerEmail },
    ]),
  );

  const planCountById = new Map<BillingPlanId, number>();
  for (const row of planRows) {
    const planId = resolveBillingPlanId(row.plan);
    planCountById.set(
      planId,
      (planCountById.get(planId) ?? 0) + Number(row.total),
    );
  }

  const planMix: PlatformPlanMixRow[] = PLAN_ORDER.map((planId) => ({
    planId,
    planName: BILLING_PLANS[planId].name,
    organizationCount: planCountById.get(planId) ?? 0,
  }));

  const tenantsUnsorted: PlatformTenantRow[] = orgRows.map((org) => {
    const planId = resolveBillingPlanId(org.billingPlan);
    const owner = ownerByOrg.get(org.id);
    return {
      organizationId: org.id,
      organizationName: org.name,
      ownerName: owner?.name ?? null,
      ownerEmail: owner?.email ?? null,
      memberCount: memberCountByOrg.get(org.id) ?? 0,
      agentCount: agentCountByOrg.get(org.id) ?? 0,
      billingPlan: planId,
      billingPlanName: BILLING_PLANS[planId].name,
      createdAt: org.createdAt,
    };
  });

  tenantsUnsorted.sort((a, b) => {
    if (b.agentCount !== a.agentCount) {
      return b.agentCount - a.agentCount;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const tenantsTruncated = tenantsUnsorted.length > TENANT_ROW_LIMIT;
  const tenants = tenantsUnsorted.slice(0, TENANT_ROW_LIMIT);

  return {
    totalUsers: Number(userCountRow[0]?.total ?? 0),
    totalOrganizations: Number(orgCountRow[0]?.total ?? 0),
    totalAgents: Number(agentCountRow[0]?.total ?? 0),
    paidOrganizations: Number(paidOrgCountRow[0]?.total ?? 0),
    planMix,
    tenants,
    tenantsTruncated,
  };
}
