/**
 * Set an organization's billing_plan (idempotent).
 *
 * Usage:
 *   BILLING_PLAN=government ORG_SLUG=my-org npm run billing:set-plan
 *   BILLING_PLAN=government ORG_NAME='NULLXES' npm run billing:set-plan
 *   BILLING_PLAN=government USER_EMAIL=ceo@nullxes.com npm run billing:set-plan
 *
 * Holding UI tier maps to DB plan `government`.
 */
import { eq, ilike } from "drizzle-orm";
import { membership } from "../src/entities/membership/schema";
import { organization } from "../src/entities/organization/schema";
import { user } from "../src/entities/user/schema";
import { loadEnvFiles } from "../src/shared/config/load-env-files";
import { db } from "../src/shared/db/client";

loadEnvFiles();

const ALLOWED = new Set([
  "free",
  "studio",
  "operator",
  "scale",
  "enterprise",
  "government",
] as const);

type PlanId = "free" | "studio" | "operator" | "scale" | "enterprise" | "government";

async function main(): Promise<void> {
  const rawPlan = (process.env.BILLING_PLAN ?? process.argv[2] ?? "").trim();
  const plan = (rawPlan === "holding" ? "government" : rawPlan) as PlanId;
  const orgSlug = process.env.ORG_SLUG?.trim();
  const orgName = process.env.ORG_NAME?.trim();
  const userEmail = process.env.USER_EMAIL?.trim().toLowerCase();

  if (!ALLOWED.has(plan)) {
    throw new Error(
      "Set BILLING_PLAN to free|studio|operator|scale|enterprise|government|holding",
    );
  }

  if (!orgSlug && !orgName && !userEmail) {
    throw new Error("Set ORG_SLUG, ORG_NAME, or USER_EMAIL");
  }

  let orgId: string | undefined;
  let resolvedName: string | undefined;
  let resolvedSlug: string | undefined;
  let previousPlan: string | undefined;

  if (orgSlug) {
    const [row] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        billingPlan: organization.billingPlan,
      })
      .from(organization)
      .where(eq(organization.slug, orgSlug))
      .limit(1);
    orgId = row?.id;
    resolvedName = row?.name;
    resolvedSlug = row?.slug;
    previousPlan = row?.billingPlan;
  } else if (orgName) {
    const [row] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        billingPlan: organization.billingPlan,
      })
      .from(organization)
      .where(ilike(organization.name, orgName))
      .limit(1);
    orgId = row?.id;
    resolvedName = row?.name;
    resolvedSlug = row?.slug;
    previousPlan = row?.billingPlan;
  } else if (userEmail) {
    const [row] = await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        billingPlan: organization.billingPlan,
      })
      .from(membership)
      .innerJoin(user, eq(membership.userId, user.id))
      .innerJoin(organization, eq(membership.organizationId, organization.id))
      .where(eq(user.email, userEmail))
      .limit(1);
    orgId = row?.id;
    resolvedName = row?.name;
    resolvedSlug = row?.slug;
    previousPlan = row?.billingPlan;
  }

  if (!orgId) {
    throw new Error("Organization not found");
  }

  if (previousPlan === plan) {
    console.log(
      `Already ${plan}: ${resolvedName} (${resolvedSlug}) [${orgId}]`,
    );
    return;
  }

  await db
    .update(organization)
    .set({ billingPlan: plan, updatedAt: new Date() })
    .where(eq(organization.id, orgId));

  console.log(
    `Updated ${resolvedName} (${resolvedSlug}) [${orgId}]: ${previousPlan} → ${plan}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
