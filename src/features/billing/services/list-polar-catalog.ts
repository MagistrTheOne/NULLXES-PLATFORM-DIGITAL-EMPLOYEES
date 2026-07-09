import { cache } from "react";
import {
  BILLING_PLANS,
  type BillingInterval,
  type BillingPlanId,
} from "../config/plans";
import {
  PRICING_TIERS,
  resolvePricingTierIdForPlan,
  type PricingTierId,
} from "../config/pricing-tiers";
import { extractPrimaryProductPrice } from "../lib/extract-product-price";
import {
  formatPolarAmount,
  formatPolarRecurringNote,
} from "../lib/format-polar-price";
import {
  BILLING_PLAN_IDS,
  readMetadataInterval,
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
  if (metadataTier === "studio") return "studio";
  if (metadataTier === "operator") return "operator";
  if (metadataTier === "scale") return "scale";
  if (metadataTier === "free") return "free";

  const normalized = input.name.toLowerCase();
  if (normalized.includes("studio")) return "studio";
  if (normalized.includes("operator") || normalized.includes("team")) {
    return "operator";
  }
  if (
    normalized.includes("scale") ||
    normalized.includes("super pro") ||
    normalized.includes("super_pro")
  ) {
    return "scale";
  }
  if (normalized.includes("enterprise")) return "enterprise";
  if (normalized.includes("government") || normalized.includes("gov")) {
    return "government";
  }
  if (normalized.includes("free") || normalized.includes("evaluation")) {
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

  if (input.planId) {
    return resolvePricingTierIdForPlan(input.planId);
  }

  const normalized = input.name.toLowerCase();
  for (const tier of PRICING_TIERS) {
    if (normalized.includes(tier.name.toLowerCase())) {
      return tier.id;
    }
  }

  return null;
}

function resolveRecurringInterval(input: {
  metadata: Record<string, unknown>;
  productInterval: string | null | undefined;
}): BillingInterval | null {
  const fromMeta = readMetadataInterval(input.metadata);
  if (fromMeta) {
    return fromMeta;
  }

  if (input.productInterval === "month" || input.productInterval === "year") {
    return input.productInterval;
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
        const recurringInterval = resolveRecurringInterval({
          metadata,
          productInterval: product.recurringInterval,
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
          recurringInterval,
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
  interval: BillingInterval = "month",
): PolarCatalogProduct | undefined {
  const matches = catalog.filter((product) => product.planId === planId);
  return (
    matches.find((product) => product.recurringInterval === interval) ??
    matches.find((product) => product.recurringInterval == null) ??
    matches[0]
  );
}

export function getPolarCatalogProductForTier(
  catalog: PolarCatalogProduct[],
  tierId: PricingTierId,
  interval: BillingInterval = "month",
): PolarCatalogProduct | undefined {
  const matches = catalog.filter((product) => product.tierId === tierId);
  const byInterval =
    matches.find((product) => product.recurringInterval === interval) ??
    matches.find((product) => product.recurringInterval == null) ??
    matches[0];

  if (byInterval) {
    return byInterval;
  }

  if (tierId === "scale") {
    return getPolarCatalogProductForPlan(catalog, "scale", interval);
  }

  return undefined;
}

export function resolvePolarProductIdForPlan(
  catalog: PolarCatalogProduct[],
  planId: BillingPlanId,
  interval: BillingInterval = "month",
): string | undefined {
  return getPolarCatalogProductForPlan(catalog, planId, interval)?.productId;
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
