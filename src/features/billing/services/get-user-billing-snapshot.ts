import { BILLING_PLANS, type BillingPlanId } from "../config/plans";
import { isManualBillingPlan } from "../lib/billing-plan-helpers";
import { buildPolarCheckoutUrl } from "../lib/build-checkout-url";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";
import { isSelfServeCheckoutPlan } from "../lib/resolve-plan-from-polar-product";
import {
  buildPolarProductPlanMap,
  getPolarCatalogProductForPlan,
  listPolarCatalog,
  resolvePolarProductIdForPlan,
} from "./list-polar-catalog";
import { isPolarConfigured } from "./polar-config";
import { tryGetPolarClient } from "./polar-client";
import { formatPolarAmount } from "../lib/format-polar-price";
import { resolveBillingPlanFromPolarProduct } from "../lib/resolve-plan-from-polar-product";

export type UserBillingSnapshot = {
  planId: BillingPlanId;
  planName: string;
  priceLabel: string;
  checkoutUrl: string | null;
  portalUrl: string | null;
  canManageBilling: boolean;
  polarReady: boolean;
};

export async function getUserBillingSnapshot(input: {
  organizationId: string;
  billingPlan: string;
  canManageOrganization: boolean;
  customerEmail?: string;
}): Promise<UserBillingSnapshot> {
  const planId = resolveBillingPlanId(input.billingPlan);
  const plan = BILLING_PLANS[planId];
  const polarReady = isPolarConfigured();
  const catalog = polarReady ? await listPolarCatalog() : [];

  let priceLabel = plan.priceLabel;
  let displayPlanId = planId;
  let displayPlanName = plan.name;

  if (polarReady) {
    const polar = tryGetPolarClient();
    if (polar) {
      try {
        const state = await polar.customers.getStateExternal({
          externalId: input.organizationId,
        });
        const activeSubscription = state.activeSubscriptions[0];
        if (activeSubscription) {
          const productPlanMap = buildPolarProductPlanMap(catalog);
          displayPlanId = resolveBillingPlanFromPolarProduct(
            activeSubscription.productId,
            productPlanMap,
          );
          displayPlanName = BILLING_PLANS[displayPlanId].name;
          priceLabel = formatPolarAmount({
            amountCents: activeSubscription.amount,
            currency: activeSubscription.currency,
          });
          if (activeSubscription.recurringInterval === "year") {
            priceLabel = `${priceLabel} / yr`;
          } else if (activeSubscription.recurringInterval === "month") {
            priceLabel = `${priceLabel} / mo`;
          }
        }
      } catch {
        // No Polar customer yet — fall through to catalog / static labels.
      }
    }

    if (priceLabel === plan.priceLabel && isSelfServeCheckoutPlan(planId)) {
      const live = getPolarCatalogProductForPlan(catalog, planId, "month");
      if (live?.hasLivePrice) {
        priceLabel = `${live.priceLabel} / mo`;
      }
    }
  }

  if (isManualBillingPlan(displayPlanId) && priceLabel === plan.priceLabel) {
    priceLabel = BILLING_PLANS[displayPlanId].priceLabel;
  }

  const studioProductId = resolvePolarProductIdForPlan(catalog, "studio");
  const scaleProductId = resolvePolarProductIdForPlan(catalog, "scale");
  const preferredProductId = studioProductId ?? scaleProductId;

  const checkoutUrl =
    planId === "free" &&
    input.canManageOrganization &&
    polarReady &&
    preferredProductId
      ? buildPolarCheckoutUrl({
          productId: preferredProductId,
          organizationId: input.organizationId,
          customerEmail: input.customerEmail,
        })
      : null;

  const portalUrl =
    isSelfServeCheckoutPlan(planId) &&
    input.canManageOrganization &&
    polarReady
      ? "/api/portal"
      : null;

  return {
    planId: displayPlanId,
    planName: displayPlanName,
    priceLabel,
    checkoutUrl,
    portalUrl,
    canManageBilling: input.canManageOrganization,
    polarReady,
  };
}
