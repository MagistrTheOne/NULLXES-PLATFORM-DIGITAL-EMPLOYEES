import { eq } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "../config/plans";
import { resolveBillingPlanFromPolarProduct } from "../lib/resolve-plan-from-polar-product";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";
import {
  buildPolarProductPlanMap,
  listPolarCatalog,
} from "./list-polar-catalog";
import { tryGetPolarClient } from "./polar-client";
import { isPolarConfigured } from "./polar-config";

const MANUAL_BILLING_PLANS: BillingPlanId[] = ["enterprise", "government"];

export type SyncOrganizationPolarBillingResult = {
  billingPlan: BillingPlanId;
  polarCustomerId: string | null;
  synced: boolean;
};

export async function syncOrganizationPolarBilling(
  organizationId: string,
): Promise<SyncOrganizationPolarBillingResult> {
  const [org] = await db
    .select({
      billingPlan: organization.billingPlan,
      polarCustomerId: organization.polarCustomerId,
    })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    return {
      billingPlan: "free",
      polarCustomerId: null,
      synced: false,
    };
  }

  const currentPlan = resolveBillingPlanId(org.billingPlan);

  if (!isPolarConfigured()) {
    return {
      billingPlan: currentPlan,
      polarCustomerId: org.polarCustomerId,
      synced: false,
    };
  }

  const polar = tryGetPolarClient();
  if (!polar) {
    return {
      billingPlan: currentPlan,
      polarCustomerId: org.polarCustomerId,
      synced: false,
    };
  }

  const catalog = await listPolarCatalog();
  const productPlanMap = buildPolarProductPlanMap(catalog);

  try {
    const state = await polar.customers.getStateExternal({
      externalId: organizationId,
    });

    const activeSubscription = state.activeSubscriptions[0];
    const updates: {
      polarCustomerId?: string;
      billingPlan?: BillingPlanId;
    } = {};

    if (state.id !== org.polarCustomerId) {
      updates.polarCustomerId = state.id;
    }

    if (activeSubscription) {
      const billingPlan = resolveBillingPlanFromPolarProduct(
        activeSubscription.productId,
        productPlanMap,
      );
      if (billingPlan !== currentPlan) {
        updates.billingPlan = billingPlan;
      }
    } else if (
      currentPlan === "super_pro" &&
      !MANUAL_BILLING_PLANS.includes(currentPlan)
    ) {
      updates.billingPlan = "free";
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(organization)
        .set(updates)
        .where(eq(organization.id, organizationId));
    }

    return {
      billingPlan: updates.billingPlan ?? currentPlan,
      polarCustomerId: updates.polarCustomerId ?? org.polarCustomerId,
      synced: true,
    };
  } catch {
    return {
      billingPlan: currentPlan,
      polarCustomerId: org.polarCustomerId,
      synced: false,
    };
  }
}

export async function syncOrganizationBillingFromPolarEvent(input: {
  externalId: string;
  customerId?: string | null;
  productId?: string | null;
  fallbackPlan?: BillingPlanId;
}): Promise<void> {
  const catalog = await listPolarCatalog();
  const productPlanMap = buildPolarProductPlanMap(catalog);

  const billingPlan =
    input.fallbackPlan ??
    resolveBillingPlanFromPolarProduct(input.productId, productPlanMap);

  await db
    .update(organization)
    .set({
      polarCustomerId: input.customerId ?? undefined,
      billingPlan,
    })
    .where(eq(organization.id, input.externalId));
}

export function isManualBillingPlan(planId: BillingPlanId): boolean {
  return MANUAL_BILLING_PLANS.includes(planId);
}

export function getBillingPlanDisplay(input: {
  planId: BillingPlanId;
  polarProductName?: string | null;
  polarPriceLabel?: string | null;
}): {
  name: string;
  priceLabel: string;
  description: string;
} {
  const plan = BILLING_PLANS[input.planId];

  return {
    name: input.polarProductName ?? plan.name,
    priceLabel: input.polarPriceLabel ?? plan.priceLabel,
    description: plan.description,
  };
}
