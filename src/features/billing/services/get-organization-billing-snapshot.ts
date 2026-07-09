import {
  SELF_SERVE_CHECKOUT_PLAN_IDS,
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
  listPolarCatalog,
  resolvePolarProductIdForPlan,
} from "./list-polar-catalog";
import { isManualBillingPlan } from "../lib/billing-plan-helpers";
import { isPolarConfigured } from "./polar-config";
import { tryGetPolarClient } from "./polar-client";
import { isSelfServeCheckoutPlan } from "../lib/resolve-plan-from-polar-product";

export type OrganizationBillingSnapshot = {
  polarReady: boolean;
  polarCatalog: PolarCatalogProduct[];
  subscription: PolarSubscriptionSnapshot | null;
  planSource: BillingPlanSource;
  /** Preferred self-serve checkout (Studio when on Evaluation). */
  checkoutUrl: string | null;
  /** Per-plan Polar checkout URLs for Studio / Operator / Scale. */
  selfServeCheckoutUrls: Partial<Record<BillingPlanId, string>>;
  /** @deprecated Use selfServeCheckoutUrls.scale or checkoutUrl */
  superProCheckoutUrl: string | null;
  portalEnabled: boolean;
};

function buildSelfServeCheckoutUrls(input: {
  catalog: PolarCatalogProduct[];
  organizationId: string;
  customerEmail?: string;
  canManageOrganization: boolean;
  polarReady: boolean;
}): Partial<Record<BillingPlanId, string>> {
  if (!input.canManageOrganization || !input.polarReady) {
    return {};
  }

  const urls: Partial<Record<BillingPlanId, string>> = {};
  for (const planId of SELF_SERVE_CHECKOUT_PLAN_IDS) {
    const productId = resolvePolarProductIdForPlan(input.catalog, planId);
    if (!productId) continue;
    urls[planId] = buildPolarCheckoutUrl({
      productId,
      organizationId: input.organizationId,
      customerEmail: input.customerEmail,
    });
  }
  return urls;
}

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

  const selfServeCheckoutUrls = buildSelfServeCheckoutUrls({
    catalog,
    organizationId: input.organizationId,
    customerEmail: input.customerEmail,
    canManageOrganization: input.canManageOrganization,
    polarReady,
  });

  const checkoutUrl =
    planId === "free"
      ? (selfServeCheckoutUrls.studio ??
        selfServeCheckoutUrls.operator ??
        selfServeCheckoutUrls.scale ??
        null)
      : null;

  const portalEnabled =
    input.canManageOrganization &&
    polarReady &&
    (Boolean(subscription) ||
      Boolean(input.polarCustomerId) ||
      isSelfServeCheckoutPlan(planId));

  return {
    polarReady,
    polarCatalog: catalog,
    subscription,
    planSource,
    checkoutUrl,
    selfServeCheckoutUrls,
    superProCheckoutUrl: selfServeCheckoutUrls.scale ?? checkoutUrl,
    portalEnabled,
  };
}
