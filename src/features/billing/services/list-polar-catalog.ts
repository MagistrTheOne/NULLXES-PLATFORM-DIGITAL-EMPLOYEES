import { cache } from "react";
import {
  BILLING_PLANS,
  getPolarProductId,
  type BillingPlanId,
} from "../config/plans";
import { extractPrimaryProductPrice } from "../lib/extract-product-price";
import {
  formatPolarAmount,
  formatPolarRecurringNote,
} from "../lib/format-polar-price";
import { tryGetPolarClient } from "./polar-client";
import type { PolarCatalogProduct } from "../types/polar-catalog";

const BILLING_PLAN_IDS: BillingPlanId[] = [
  "free",
  "super_pro",
  "enterprise",
  "government",
];

function readMetadataPlan(metadata: Record<string, unknown>): BillingPlanId | null {
  const raw = metadata.plan;
  if (typeof raw !== "string") {
    return null;
  }

  return BILLING_PLAN_IDS.includes(raw as BillingPlanId)
    ? (raw as BillingPlanId)
    : null;
}

function resolvePlanIdForProduct(input: {
  productId: string;
  name: string;
  metadata: Record<string, unknown>;
}): BillingPlanId | null {
  const metadataPlan = readMetadataPlan(input.metadata);
  if (metadataPlan) {
    return metadataPlan;
  }

  for (const planId of BILLING_PLAN_IDS) {
    const envProductId = getPolarProductId(planId);
    if (envProductId && envProductId === input.productId) {
      return planId;
    }
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
        const price = extractPrimaryProductPrice(product);
        const priceLabel = price
          ? formatPolarAmount({
              amountCents: price.amountCents,
              currency: price.currency,
            })
          : BILLING_PLANS[planId ?? "free"]?.priceLabel ?? "Contact sales";
        const priceNote = product.isRecurring
          ? formatPolarRecurringNote(
              product.recurringInterval,
              product.recurringIntervalCount ?? 1,
            )
          : "one-time";

        const planDefinition = planId ? BILLING_PLANS[planId] : null;

        products.push({
          productId: product.id,
          planId,
          name: product.name,
          description: product.description,
          priceLabel,
          priceNote,
          isRecurring: product.isRecurring,
          checkoutEnabled: planDefinition?.checkoutEnabled ?? false,
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

export function buildPolarProductPlanMap(
  catalog: PolarCatalogProduct[],
): Map<string, BillingPlanId> {
  const map = new Map<string, BillingPlanId>();

  for (const product of catalog) {
    if (product.planId) {
      map.set(product.productId, product.planId);
    }
  }

  for (const planId of BILLING_PLAN_IDS) {
    const envProductId = getPolarProductId(planId);
    if (envProductId) {
      map.set(envProductId, planId);
    }
  }

  return map;
}
