import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { digitalEmployee } from "@/entities/digital-employee/schema";
import { membership } from "@/entities/membership/schema";
import { organization } from "@/entities/organization/schema";
import { user } from "@/entities/user/schema";
import type { BillingPlanId } from "@/features/billing/config/plans";
import { BILLING_PLANS } from "@/features/billing/config/plans";
import { resolveBillingPlanId } from "@/features/billing/lib/resolve-billing-plan";
import { db } from "@/shared/db/client";
import { isEphemeralVerifyOrganizationName } from "../lib/is-ephemeral-verify-organization";

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
  const [orgRows, memberCountRows, agentCountRows, ownerRows] =
    await Promise.all([
      db
        .select({
          id: organization.id,
          name: organization.name,
          billingPlan: organization.billingPlan,
          createdAt: organization.createdAt,
        })
        .from(organization)
        .orderBy(desc(organization.createdAt)),
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
    ]);

  const realOrgs = orgRows.filter(
    (org) => !isEphemeralVerifyOrganizationName(org.name),
  );
  const realOrgIds = new Set(realOrgs.map((org) => org.id));

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

  let totalAgents = 0;
  let paidOrganizations = 0;
  const planCountById = new Map<BillingPlanId, number>();

  for (const org of realOrgs) {
    const planId = resolveBillingPlanId(org.billingPlan);
    planCountById.set(planId, (planCountById.get(planId) ?? 0) + 1);
    totalAgents += agentCountByOrg.get(org.id) ?? 0;
    if (planId !== "free") {
      paidOrganizations += 1;
    }
  }

  const planMix: PlatformPlanMixRow[] = PLAN_ORDER.map((planId) => ({
    planId,
    planName: BILLING_PLANS[planId].name,
    organizationCount: planCountById.get(planId) ?? 0,
  }));

  const tenantsUnsorted: PlatformTenantRow[] = realOrgs.map((org) => {
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

  const realOrgIdList = [...realOrgIds];
  let totalUsers = 0;
  if (realOrgIdList.length > 0) {
    const [userCountRow] = await db
      .select({
        total: sql<number>`count(distinct ${membership.userId})::int`,
      })
      .from(membership)
      .where(inArray(membership.organizationId, realOrgIdList));
    totalUsers = Number(userCountRow?.total ?? 0);
  }

  return {
    totalUsers,
    totalOrganizations: realOrgs.length,
    totalAgents,
    paidOrganizations,
    planMix,
    tenants,
    tenantsTruncated,
  };
}
