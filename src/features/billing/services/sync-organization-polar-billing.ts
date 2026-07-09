import { eq } from "drizzle-orm";
import { organization } from "@/entities/organization/schema";
import { db } from "@/shared/db/client";
import type { BillingPlanId } from "../config/plans";
import { MANUAL_BILLING_PLANS } from "../lib/billing-plan-helpers";
import {
  isSelfServeCheckoutPlan,
  resolveBillingPlanFromPolarProduct,
} from "../lib/resolve-plan-from-polar-product";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";
import {
  buildPolarProductPlanMap,
  listPolarCatalog,
} from "./list-polar-catalog";
import { tryGetPolarClient } from "./polar-client";
import { isPolarConfigured } from "./polar-config";

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
      isSelfServeCheckoutPlan(currentPlan) &&
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
  const catalogProduct = input.productId
    ? catalog.find((product) => product.productId === input.productId)
    : undefined;

  // Payment verification is a one-time smoke charge — never mutate billing_plan.
  if (catalogProduct?.isVerification) {
    if (input.customerId) {
      await db
        .update(organization)
        .set({ polarCustomerId: input.customerId })
        .where(eq(organization.id, input.externalId));
    }
    return;
  }

  const billingPlan =
    input.fallbackPlan ??
    resolveBillingPlanFromPolarProduct(input.productId, productPlanMap);

  // Unknown / unmapped products must not overwrite an existing plan.
  if (
    input.fallbackPlan == null &&
    input.productId &&
    !productPlanMap.has(input.productId) &&
    billingPlan === "free"
  ) {
    if (input.customerId) {
      await db
        .update(organization)
        .set({ polarCustomerId: input.customerId })
        .where(eq(organization.id, input.externalId));
    }
    return;
  }

  await db
    .update(organization)
    .set({
      polarCustomerId: input.customerId ?? undefined,
      billingPlan,
    })
    .where(eq(organization.id, input.externalId));
}

export { isManualBillingPlan } from "../lib/billing-plan-helpers";
