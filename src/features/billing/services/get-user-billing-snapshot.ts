import { BILLING_PLANS, type BillingPlanId } from "../config/plans";
import { buildPolarCheckoutUrl } from "../lib/build-checkout-url";
import { resolveBillingPlanId } from "../lib/resolve-billing-plan";
import {
  listPolarCatalog,
  resolvePolarProductIdForPlan,
} from "./list-polar-catalog";
import { isPolarConfigured } from "./polar-config";

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
  const superProProductId = resolvePolarProductIdForPlan(catalog, "super_pro");

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

  const portalUrl =
    planId === "super_pro" && input.canManageOrganization && polarReady
      ? "/api/portal"
      : null;

  return {
    planId,
    planName: plan.name,
    priceLabel: plan.priceLabel,
    checkoutUrl,
    portalUrl,
    canManageBilling: input.canManageOrganization,
    polarReady,
  };
}
