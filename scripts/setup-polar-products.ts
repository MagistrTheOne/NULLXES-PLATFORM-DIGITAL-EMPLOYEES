import { Polar } from "@polar-sh/sdk";
import {
  BILLING_PLANS,
  SELF_SERVE_CHECKOUT_PLAN_IDS,
  SELF_SERVE_PRICE_CENTS,
  type BillingInterval,
  type BillingPlanId,
} from "../src/features/billing/config/plans";
import {
  PRICING_TIERS,
  type PricingTierId,
} from "../src/features/billing/config/pricing-tiers";
import { POLAR_PRODUCT_NAMESPACE } from "../src/features/billing/lib/polar-product-metadata";

/**
 * Sync NULLXES self-serve + sales products in Polar via Core API.
 *
 * Month and year are separate products (recurring_interval is immutable).
 *
 * Usage: npm run polar:setup
 *
 * Docs: https://polar.sh/docs/api-reference/products/create
 *       https://polar.sh/docs/api-reference/products/update
 */

const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();

if (!accessToken) {
  console.error("POLAR_ACCESS_TOKEN is required");
  process.exit(1);
}

const server =
  process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production";

const polar = new Polar({
  accessToken,
  server,
});

type ListedPrice = {
  id: string;
  amountType?: string;
  priceAmount?: number | null;
  amount?: number | null;
  isArchived?: boolean;
};

type ListedProduct = {
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  isArchived: boolean;
  recurringInterval: string | null;
  metadata: Record<string, string>;
  prices: ListedPrice[];
};

type ProductSpec = {
  key: string;
  name: string;
  description: string;
  recurringInterval: BillingInterval;
  priceAmount: number;
  metadata: Record<string, string>;
  /** Prefer remapping this legacy product when creating/updating. */
  legacyNames?: string[];
};

const INTERVALS: BillingInterval[] = ["month", "year"];

const BILLING_PLAN_SPECS: ProductSpec[] = (
  SELF_SERVE_CHECKOUT_PLAN_IDS as Array<"studio" | "operator" | "scale">
).flatMap((planId) => {
  const plan = BILLING_PLANS[planId];
  return INTERVALS.map((interval) => {
    const suffix = interval === "year" ? " (Annual)" : "";
    return {
      key: `${planId}:${interval}`,
      name: `NULLXES ${plan.name}${suffix}`,
      description: plan.description,
      recurringInterval: interval,
      priceAmount: SELF_SERVE_PRICE_CENTS[planId][interval],
      metadata: {
        plan: planId,
        tier: planId,
        interval,
        product: POLAR_PRODUCT_NAMESPACE,
      },
      legacyNames:
        planId === "scale" && interval === "month"
          ? ["nullxes super pro", "super pro"]
          : planId === "operator"
            ? ["nullxes operator", "operator"]
            : undefined,
    };
  });
});

const SALES_TIER_IDS: PricingTierId[] = [
  "discovery",
  "pilot",
  "department",
  "holding",
  "flagship",
];

function buildSalesTierSpecs(): ProductSpec[] {
  return SALES_TIER_IDS.map((tierId) => {
    const tier = PRICING_TIERS.find((item) => item.id === tierId);
    if (!tier) {
      throw new Error(`Missing pricing tier definition: ${tierId}`);
    }

    return {
      key: `tier:${tierId}`,
      name: `NULLXES ${tier.name}`,
      description: tier.description,
      recurringInterval: "year" as const,
      priceAmount: 0,
      metadata: {
        tier: tierId,
        interval: "year",
        product: POLAR_PRODUCT_NAMESPACE,
      },
      legacyNames:
        tierId === "flagship" ? ["nullxes ultra", "ultra"] : undefined,
    };
  });
}

function activeFixedAmount(product: ListedProduct): number | null {
  for (const price of product.prices) {
    if (price.isArchived) continue;
    if (price.amountType === "fixed") {
      return price.priceAmount ?? price.amount ?? null;
    }
  }
  return null;
}

function activeFixedPriceId(product: ListedProduct): string | null {
  for (const price of product.prices) {
    if (price.isArchived) continue;
    if (price.amountType === "fixed") {
      return price.id;
    }
  }
  return null;
}

async function listAllProducts(): Promise<ListedProduct[]> {
  const products: ListedProduct[] = [];

  const iterator = await polar.products.list({ limit: 100 });
  for await (const page of iterator) {
    for (const product of page.result.items) {
      const metadata = Object.fromEntries(
        Object.entries(product.metadata).map(([key, value]) => [
          key,
          String(value),
        ]),
      );

      products.push({
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        isRecurring: product.isRecurring,
        isArchived: product.isArchived,
        recurringInterval: product.recurringInterval ?? null,
        metadata,
        prices: product.prices.map((price) => ({
          id: price.id,
          amountType: "amountType" in price ? String(price.amountType) : undefined,
          priceAmount:
            "priceAmount" in price
              ? (price.priceAmount as number | null | undefined)
              : undefined,
          amount:
            "amount" in price ? (price.amount as number | null | undefined) : undefined,
          isArchived:
            "isArchived" in price ? Boolean(price.isArchived) : undefined,
        })),
      });
    }
  }

  return products;
}

function findSelfServeProduct(
  products: ListedProduct[],
  planId: BillingPlanId,
  interval: BillingInterval,
  legacyNames?: string[],
): ListedProduct | undefined {
  const active = products.filter((product) => !product.isArchived);

  const byMeta = active.find(
    (product) =>
      product.metadata.plan === planId &&
      (product.metadata.interval === interval ||
        (!product.metadata.interval &&
          product.recurringInterval === interval)),
  );
  if (byMeta) return byMeta;

  // Legacy Super Pro → Scale month
  if (planId === "scale" && interval === "month") {
    const superPro = active.find(
      (product) =>
        product.metadata.plan === "super_pro" ||
        product.name.toLowerCase().includes("super pro"),
    );
    if (superPro) return superPro;
  }

  if (legacyNames?.length) {
    const byName = active.find((product) => {
      const name = product.name.toLowerCase();
      return (
        legacyNames.some((legacy) => name.includes(legacy)) &&
        (product.recurringInterval === interval ||
          product.metadata.interval === interval ||
          (!product.metadata.interval && interval === "month"))
      );
    });
    if (byName) return byName;
  }

  return undefined;
}

function findSalesProduct(
  products: ListedProduct[],
  tierId: PricingTierId,
  legacyNames?: string[],
): ListedProduct | undefined {
  const active = products.filter((product) => !product.isArchived);

  const byMeta = active.find((product) => {
    const tier = product.metadata.tier;
    if (tier === tierId) return true;
    if (tierId === "flagship" && tier === "ultra") return true;
    return false;
  });
  if (byMeta) return byMeta;

  if (legacyNames?.length) {
    return active.find((product) => {
      const name = product.name.toLowerCase();
      return legacyNames.some((legacy) => name.includes(legacy));
    });
  }

  const tierName = PRICING_TIERS.find((tier) => tier.id === tierId)?.name;
  if (tierName) {
    return active.find((product) =>
      product.name.toLowerCase().includes(tierName.toLowerCase()),
    );
  }

  return undefined;
}

async function ensureProductSynced(
  existing: ListedProduct[],
  spec: ProductSpec,
  product: ListedProduct | undefined,
): Promise<ListedProduct> {
  if (!product) {
    console.log(`\nCreating "${spec.name}"…`);
    const created = await polar.products.create({
      name: spec.name,
      description: spec.description,
      recurringInterval: spec.recurringInterval,
      prices: [
        {
          amountType: "fixed",
          priceCurrency: "usd",
          priceAmount: spec.priceAmount,
        },
      ],
      metadata: spec.metadata,
    });

    const listed: ListedProduct = {
      id: created.id,
      name: created.name,
      description: created.description ?? null,
      isRecurring: created.isRecurring,
      isArchived: created.isArchived,
      recurringInterval: created.recurringInterval ?? null,
      metadata: spec.metadata,
      prices: created.prices.map((price) => ({
        id: price.id,
        amountType: "amountType" in price ? String(price.amountType) : "fixed",
        priceAmount:
          "priceAmount" in price
            ? (price.priceAmount as number | null | undefined)
            : undefined,
        isArchived: false,
      })),
    };
    existing.push(listed);
    console.log(`Created ${spec.name}: ${created.id}`);
    return listed;
  }

  console.log(`\n${spec.name}: ${product.id}`);

  const currentAmount = activeFixedAmount(product);
  const currentPriceId = activeFixedPriceId(product);
  const needsPriceReplace =
    currentAmount == null || currentAmount !== spec.priceAmount;
  const needsMeta = Object.entries(spec.metadata).some(
    ([key, value]) => product.metadata[key] !== value,
  );
  const needsName = product.name !== spec.name;
  const needsDescription = (product.description ?? "") !== spec.description;

  if (!needsPriceReplace && !needsMeta && !needsName && !needsDescription) {
    console.log("  already in sync");
    return product;
  }

  const prices = needsPriceReplace
    ? [
        {
          amountType: "fixed" as const,
          priceCurrency: "usd" as const,
          priceAmount: spec.priceAmount,
        },
      ]
    : currentPriceId
      ? [{ id: currentPriceId }]
      : undefined;

  await polar.products.update({
    id: product.id,
    productUpdate: {
      name: spec.name,
      description: spec.description,
      metadata: {
        ...product.metadata,
        ...spec.metadata,
      },
      ...(prices ? { prices } : {}),
    },
  });

  console.log(
    `  updated${needsPriceReplace ? ` price→${spec.priceAmount}` : ""}${needsMeta ? " metadata" : ""}${needsName ? " name" : ""}`,
  );

  product.name = spec.name;
  product.description = spec.description;
  product.metadata = { ...product.metadata, ...spec.metadata };
  return product;
}

async function archiveLegacyProducts(products: ListedProduct[]): Promise<void> {
  const keepIds = new Set(
    products
      .filter(
        (product) =>
          !product.isArchived &&
          (product.metadata.product === POLAR_PRODUCT_NAMESPACE ||
            product.metadata.plan ||
            product.metadata.tier),
      )
      .map((product) => product.id),
  );

  // After sync, also archive known junk names without namespace metadata.
  const junkNameMatchers = [
    /^monthly$/i,
    /^yearly$/i,
    /^enterprise$/i,
  ];

  for (const product of products) {
    if (product.isArchived) continue;

    const isJunkName = junkNameMatchers.some((re) => re.test(product.name.trim()));
    const unmapped =
      product.metadata.product !== POLAR_PRODUCT_NAMESPACE &&
      !product.metadata.plan &&
      !product.metadata.tier;

    if (!isJunkName && !unmapped) {
      continue;
    }

    // Do not archive products we just mapped into the namespace.
    if (keepIds.has(product.id) && !isJunkName) {
      continue;
    }

    // If it gained namespace metadata during this run, skip.
    if (product.metadata.product === POLAR_PRODUCT_NAMESPACE && !isJunkName) {
      continue;
    }

    console.log(`\nArchiving legacy "${product.name}" (${product.id})…`);
    await polar.products.update({
      id: product.id,
      productUpdate: {
        isArchived: true,
      },
    });
    product.isArchived = true;
    console.log("  archived");
  }
}

async function main(): Promise<void> {
  console.log(`Polar server: ${server}`);
  console.log("Syncing NULLXES billing products (month + year)…\n");

  const existing = await listAllProducts();

  console.log("Current products:");
  for (const product of existing.filter((item) => !item.isArchived)) {
    const plan = product.metadata.plan ? ` plan=${product.metadata.plan}` : "";
    const tier = product.metadata.tier ? ` tier=${product.metadata.tier}` : "";
    const interval = product.metadata.interval
      ? ` interval=${product.metadata.interval}`
      : product.recurringInterval
        ? ` interval=${product.recurringInterval}`
        : "";
    const amount = activeFixedAmount(product);
    console.log(
      `- ${product.name} (${product.id})${plan}${tier}${interval} amount=${amount ?? "n/a"}`,
    );
  }

  for (const spec of BILLING_PLAN_SPECS) {
    const planId = spec.metadata.plan as BillingPlanId;
    const interval = spec.recurringInterval;
    const found = findSelfServeProduct(
      existing,
      planId,
      interval,
      spec.legacyNames,
    );
    await ensureProductSynced(existing, spec, found);
  }

  for (const spec of buildSalesTierSpecs()) {
    const tierId = spec.metadata.tier as PricingTierId;
    const found = findSalesProduct(existing, tierId, spec.legacyNames);
    await ensureProductSynced(existing, spec, found);
  }

  // Refresh list for archive pass so metadata updates are visible.
  const refreshed = await listAllProducts();
  await archiveLegacyProducts(refreshed);

  console.log("\nDone. Required env:");
  console.log("  POLAR_ACCESS_TOKEN");
  console.log("  POLAR_WEBHOOK_SECRET");
  console.log("  POLAR_SERVER=production");
  console.log("\nDashboard: https://polar.sh/dashboard/nullxes-llc/products");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
