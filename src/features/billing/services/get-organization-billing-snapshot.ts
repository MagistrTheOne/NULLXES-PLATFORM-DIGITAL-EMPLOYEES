import {
  SELF_SERVE_CHECKOUT_PLAN_IDS,
  type BillingInterval,
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
  SelfServeCheckoutUrls,
} from "../types/polar-catalog";
import {
  buildPolarProductPlanMap,
  countSelfServeCheckoutProducts,
  listPolarCatalog,
  resolvePolarProductIdForPlan,
  resolvePolarVerificationProduct,
} from "./list-polar-catalog";
import { isManualBillingPlan } from "../lib/billing-plan-helpers";
import { isPolarConfigured } from "./polar-config";
import { tryGetPolarClient } from "./polar-client";
import { isSelfServeCheckoutPlan } from "../lib/resolve-plan-from-polar-product";
import {
  getTbankTaxation,
  getTbankTerminalDisplay,
  getTbankTestAmountKopecks,
  getTbankVat,
  isTbankConfigured,
  isTbankReceiptEnabled,
} from "../tbank/config";

export type TbankBillingSnapshot = {
  ready: boolean;
  receiptEnabled: boolean;
  terminalLabel: string | null;
  taxation: string;
  vat: string;
  testAmountKopecks: number;
  payPath: string;
};

export type OrganizationBillingSnapshot = {
  polarReady: boolean;
  polarCatalog: PolarCatalogProduct[];
  subscription: PolarSubscriptionSnapshot | null;
  planSource: BillingPlanSource;
  /** Preferred self-serve checkout (Studio monthly when on Evaluation). */
  checkoutUrl: string | null;
  /** Per-plan Polar checkout URLs for Studio / Team / Scale × month|year. */
  selfServeCheckoutUrls: SelfServeCheckoutUrls;
  /** @deprecated Use selfServeCheckoutUrls.scale.month or checkoutUrl */
  superProCheckoutUrl: string | null;
  /** One-time $1 verification checkout (does not change plan). */
  verificationCheckoutUrl: string | null;
  /** Count of priced Studio/Team/Scale Polar products ready for checkout. */
  selfServeLiveCount: number;
  portalEnabled: boolean;
  tbank: TbankBillingSnapshot;
};

const BILLING_INTERVALS: BillingInterval[] = ["month", "year"];

function buildSelfServeCheckoutUrls(input: {
  catalog: PolarCatalogProduct[];
  organizationId: string;
  customerEmail?: string;
  canManageOrganization: boolean;
  polarReady: boolean;
}): SelfServeCheckoutUrls {
  if (!input.canManageOrganization || !input.polarReady) {
    return {};
  }

  const urls: SelfServeCheckoutUrls = {};
  for (const planId of SELF_SERVE_CHECKOUT_PLAN_IDS) {
    if (
      planId !== "starter" &&
      planId !== "studio" &&
      planId !== "operator" &&
      planId !== "scale"
    ) {
      continue;
    }

    const byInterval: Partial<Record<BillingInterval, string>> = {};
    for (const interval of BILLING_INTERVALS) {
      const productId = resolvePolarProductIdForPlan(
        input.catalog,
        planId,
        interval,
      );
      if (!productId) continue;
      byInterval[interval] = buildPolarCheckoutUrl({
        productId,
        organizationId: input.organizationId,
        customerEmail: input.customerEmail,
      });
    }

    if (Object.keys(byInterval).length > 0) {
      urls[planId] = byInterval;
    }
  }
  return urls;
}

function firstCheckoutUrl(
  urls: SelfServeCheckoutUrls,
  planId: "starter" | "studio" | "operator" | "scale",
): string | null {
  return urls[planId]?.month ?? urls[planId]?.year ?? null;
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

  const verificationProduct = resolvePolarVerificationProduct(catalog);
  const verificationCheckoutUrl =
    input.canManageOrganization &&
    polarReady &&
    verificationProduct?.productId
      ? buildPolarCheckoutUrl({
          productId: verificationProduct.productId,
          organizationId: input.organizationId,
          customerEmail: input.customerEmail,
        })
      : null;

  const checkoutUrl =
    planId === "free"
      ? (firstCheckoutUrl(selfServeCheckoutUrls, "studio") ??
        firstCheckoutUrl(selfServeCheckoutUrls, "operator") ??
        firstCheckoutUrl(selfServeCheckoutUrls, "scale") ??
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
    superProCheckoutUrl:
      firstCheckoutUrl(selfServeCheckoutUrls, "scale") ?? checkoutUrl,
    verificationCheckoutUrl,
    selfServeLiveCount: countSelfServeCheckoutProducts(catalog),
    portalEnabled,
    tbank: {
      ready: isTbankConfigured(),
      receiptEnabled: isTbankReceiptEnabled(),
      terminalLabel: getTbankTerminalDisplay(),
      taxation: getTbankTaxation(),
      vat: getTbankVat(),
      testAmountKopecks: getTbankTestAmountKopecks(),
      payPath: "/billing/tbank",
    },
  };
}
