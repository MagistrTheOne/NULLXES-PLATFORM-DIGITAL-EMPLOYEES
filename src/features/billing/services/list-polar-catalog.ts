import { cache } from "react";
import { BILLING_PLANS, type BillingPlanId } from "../config/plans";
import { PRICING_TIERS, type PricingTierId } from "../config/pricing-tiers";
import { extractPrimaryProductPrice } from "../lib/extract-product-price";
import {
  formatPolarAmount,
  formatPolarRecurringNote,
} from "../lib/format-polar-price";
import {
  BILLING_PLAN_IDS,
  readMetadataPlan,
  readMetadataTier,
} from "../lib/polar-product-metadata";
import { tryGetPolarClient } from "./polar-client";
import type { PolarCatalogProduct } from "../types/polar-catalog";

function resolvePlanIdForProduct(input: {
  productId: string;
  name: string;
  metadata: Record<string, unknown>;
}): BillingPlanId | null {
  const metadataPlan = readMetadataPlan(input.metadata);
  if (metadataPlan) {
    return metadataPlan;
  }

  const metadataTier = readMetadataTier(input.metadata);
  if (metadataTier === "super_pro") {
    return "super_pro";
  }

  const normalized = input.name.toLowerCase();
  if (normalized.includes("super pro")) {
    return "super_pro";
  }
  if (normalized.includes("enterprise")) {
    return "enterprise";
  }
  if (normalized.includes("government") || normalized.includes("gov")) {
    return "government";
  }
  if (normalized.includes("free")) {
    return "free";
  }

  return null;
}

function resolveTierIdForProduct(input: {
  name: string;
  metadata: Record<string, unknown>;
  planId: BillingPlanId | null;
}): PricingTierId | null {
  const metadataTier = readMetadataTier(input.metadata);
  if (metadataTier) {
    return metadataTier;
  }

  if (input.planId === "super_pro") {
    return "super_pro";
  }
  if (input.planId === "enterprise") {
    return "department";
  }
  if (input.planId === "government") {
    return "holding";
  }
  if (input.planId === "free") {
    return "free";
  }

  const normalized = input.name.toLowerCase();
  for (const tier of PRICING_TIERS) {
    if (normalized.includes(tier.name.toLowerCase())) {
      return tier.id;
    }
  }

  return null;
}

function fallbackTierPrice(tierId: PricingTierId | null): {
  priceLabel: string;
  priceNote: string;
} {
  const tier = PRICING_TIERS.find((item) => item.id === tierId);
  return {
    priceLabel: tier?.priceLabel ?? "Contact sales",
    priceNote: tier?.priceNote ?? "",
  };
}

export const listPolarCatalog = cache(async (): Promise<PolarCatalogProduct[]> => {
  const polar = tryGetPolarClient();
  if (!polar) {
    return [];
  }

  const products: PolarCatalogProduct[] = [];

  try {
    const iterator = await polar.products.list({ limit: 100 });
    for await (const page of iterator) {
      for (const product of page.result.items) {
        if (product.isArchived) {
          continue;
        }

        const metadata = product.metadata as Record<string, unknown>;
        const planId = resolvePlanIdForProduct({
          productId: product.id,
          name: product.name,
          metadata,
        });
        const tierId = resolveTierIdForProduct({
          name: product.name,
          metadata,
          planId,
        });
        const price = extractPrimaryProductPrice(product);
        const hasLivePrice = Boolean(price && price.amountCents > 0);
        const polarPriceLabel = price
          ? formatPolarAmount({
              amountCents: price.amountCents,
              currency: price.currency,
            })
          : null;
        const tierFallback = fallbackTierPrice(tierId);
        const priceLabel =
          hasLivePrice && polarPriceLabel
            ? polarPriceLabel
            : tierFallback.priceLabel;
        const priceNote = product.isRecurring
          ? formatPolarRecurringNote(
              product.recurringInterval,
              product.recurringIntervalCount ?? 1,
            )
          : hasLivePrice
            ? "one-time"
            : tierFallback.priceNote;

        const planDefinition = planId ? BILLING_PLANS[planId] : null;

        products.push({
          productId: product.id,
          planId,
          tierId,
          name: product.name,
          description: product.description,
          priceLabel,
          priceNote,
          isRecurring: product.isRecurring,
          checkoutEnabled:
            Boolean(planDefinition?.checkoutEnabled && hasLivePrice),
          hasLivePrice,
        });
      }
    }
  } catch {
    return [];
  }

  return products;
});

export function getPolarCatalogProductForPlan(
  catalog: PolarCatalogProduct[],
  planId: BillingPlanId,
): PolarCatalogProduct | undefined {
  return catalog.find((product) => product.planId === planId);
}

export function getPolarCatalogProductForTier(
  catalog: PolarCatalogProduct[],
  tierId: PricingTierId,
): PolarCatalogProduct | undefined {
  return (
    catalog.find((product) => product.tierId === tierId) ??
    (tierId === "super_pro"
      ? getPolarCatalogProductForPlan(catalog, "super_pro")
      : undefined)
  );
}

export function resolvePolarProductIdForPlan(
  catalog: PolarCatalogProduct[],
  planId: BillingPlanId,
): string | undefined {
  return getPolarCatalogProductForPlan(catalog, planId)?.productId;
}

export function buildPolarProductPlanMap(
  catalog: PolarCatalogProduct[],
): Map<string, BillingPlanId> {
  const map = new Map<string, BillingPlanId>();

  for (const product of catalog) {
    if (product.planId) {
      map.set(product.productId, product.planId);
    }
  }

  return map;
}

export { BILLING_PLAN_IDS };
