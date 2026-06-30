import {
  getPolarProductId,
  type BillingPlanId,
} from "../config/plans";
import { buildPolarCheckoutUrl } from "../lib/build-checkout-url";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";
import {
  formatPolarAmount,
  formatPolarRecurringNote,
} from "../lib/format-polar-price";
import { resolveBillingPlanFromPolarProduct } from "../lib/resolve-plan-from-polar-product";
import type {
  BillingPlanSource,
  PolarCatalogProduct,
  PolarSubscriptionSnapshot,
} from "../types/polar-catalog";
import {
  buildPolarProductPlanMap,
  getPolarCatalogProductForPlan,
  listPolarCatalog,
} from "./list-polar-catalog";
import { isManualBillingPlan } from "./sync-organization-polar-billing";
import { isPolarConfigured } from "./polar-config";
import { tryGetPolarClient } from "./polar-client";

export type OrganizationBillingSnapshot = {
  polarReady: boolean;
  polarCatalog: PolarCatalogProduct[];
  subscription: PolarSubscriptionSnapshot | null;
  planSource: BillingPlanSource;
  checkoutUrl: string | null;
  superProCheckoutUrl: string | null;
  portalEnabled: boolean;
};

export async function getOrganizationBillingSnapshot(input: {
  organizationId: string;
  billingPlan: string;
  polarCustomerId: string | null;
  canManageOrganization: boolean;
  customerEmail?: string;
}): Promise<OrganizationBillingSnapshot> {
  const polarReady = isPolarConfigured();
  const planId = resolveBillingPlanId(input.billingPlan);
  const catalog = polarReady ? await listPolarCatalog() : [];
  const productPlanMap = buildPolarProductPlanMap(catalog);

  let subscription: PolarSubscriptionSnapshot | null = null;
  let planSource: BillingPlanSource = planId === "free" ? "free" : "manual";

  const polar = tryGetPolarClient();
  if (polar) {
    try {
      const state = await polar.customers.getStateExternal({
        externalId: input.organizationId,
      });

      const activeSubscription = state.activeSubscriptions[0];
      if (activeSubscription) {
        const subscriptionPlan = resolveBillingPlanFromPolarProduct(
          activeSubscription.productId,
          productPlanMap,
        );

        subscription = {
          subscriptionId: activeSubscription.id,
          productId: activeSubscription.productId,
          planId: subscriptionPlan,
          status: activeSubscription.status,
          priceLabel: formatPolarAmount({
            amountCents: activeSubscription.amount,
            currency: activeSubscription.currency,
          }),
          priceNote: formatPolarRecurringNote(
            activeSubscription.recurringInterval,
          ),
          currentPeriodEnd: activeSubscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
        };

        planSource = "polar";
      }
    } catch {
      // No Polar customer yet — fall back to DB plan.
    }
  }

  if (!subscription) {
    if (planId === "free") {
      planSource = "free";
    } else if (isManualBillingPlan(planId)) {
      planSource = "manual";
    }
  }

  const superProProductId =
    getPolarCatalogProductForPlan(catalog, "super_pro")?.productId ??
    getPolarProductId("super_pro");

  const checkoutUrl =
    planId === "free" &&
    input.canManageOrganization &&
    polarReady &&
    superProProductId
      ? buildPolarCheckoutUrl({
          productId: superProProductId,
          organizationId: input.organizationId,
          customerEmail: input.customerEmail,
        })
      : null;

  const portalEnabled =
    input.canManageOrganization &&
    polarReady &&
    (Boolean(subscription) ||
      Boolean(input.polarCustomerId) ||
      planId === "super_pro");

  return {
    polarReady,
    polarCatalog: catalog,
    subscription,
    planSource,
    checkoutUrl,
    superProCheckoutUrl: checkoutUrl,
    portalEnabled,
  };
}

export function resolveEffectiveBillingPlanId(input: {
  dbPlanId: BillingPlanId;
  subscription: PolarSubscriptionSnapshot | null;
}): BillingPlanId {
  return input.subscription?.planId ?? input.dbPlanId;
}

export function getPolarCatalogPriceForTier(
  catalog: PolarCatalogProduct[],
  tierId: "free" | "super_pro",
): Pick<PolarCatalogProduct, "priceLabel" | "priceNote"> | null {
  if (tierId !== "super_pro") {
    return null;
  }

  const product = getPolarCatalogProductForPlan(catalog, "super_pro");
  if (!product) {
    return null;
  }

  return {
    priceLabel: product.priceLabel,
    priceNote: product.priceNote,
  };
}
