import { Polar } from "@polar-sh/sdk";
import {
  BILLING_PLANS,
  type BillingPlanId,
} from "../src/features/billing/config/plans";
import {
  PRICING_TIERS,
  type PricingTierId,
} from "../src/features/billing/config/pricing-tiers";
import { POLAR_PRODUCT_NAMESPACE } from "../src/features/billing/lib/polar-product-metadata";

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

type ListedProduct = {
  id: string;
  name: string;
  isRecurring: boolean;
  metadata: Record<string, string>;
};

type ProductSpec = {
  key: string;
  name: string;
  description: string;
  recurringInterval: "month" | "year";
  priceAmount: number;
  metadata: Record<string, string>;
};

const BILLING_PLAN_SPECS: ProductSpec[] = [
  {
    key: "super_pro",
    name: "NULLXES Super Pro",
    description: BILLING_PLANS.super_pro.description,
    recurringInterval: "month",
    priceAmount: 95_000,
    metadata: {
      plan: "super_pro",
      tier: "super_pro",
      product: POLAR_PRODUCT_NAMESPACE,
    },
  },
  {
    key: "enterprise",
    name: "NULLXES Enterprise",
    description: BILLING_PLANS.enterprise.description,
    recurringInterval: "year",
    priceAmount: 0,
    metadata: {
      plan: "enterprise",
      product: POLAR_PRODUCT_NAMESPACE,
    },
  },
  {
    key: "government",
    name: "NULLXES Government",
    description: BILLING_PLANS.government.description,
    recurringInterval: "year",
    priceAmount: 0,
    metadata: {
      plan: "government",
      product: POLAR_PRODUCT_NAMESPACE,
    },
  },
];

const SALES_TIER_IDS: PricingTierId[] = [
  "discovery",
  "pilot",
  "department",
  "holding",
  "ultra",
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
      recurringInterval: tierId === "ultra" ? "year" : "year",
      priceAmount: 0,
      metadata: {
        tier: tierId,
        product: POLAR_PRODUCT_NAMESPACE,
      },
    };
  });
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
        isRecurring: product.isRecurring,
        metadata,
      });
    }
  }

  return products;
}

function findProductByMetadata(
  products: ListedProduct[],
  metadata: Record<string, string>,
): ListedProduct | undefined {
  return products.find((product) =>
    Object.entries(metadata).every(
      ([key, value]) => product.metadata[key] === value,
    ),
  );
}

function findProductByPlan(
  products: ListedProduct[],
  planId: BillingPlanId,
): ListedProduct | undefined {
  return (
    products.find((product) => product.metadata.plan === planId) ??
    products.find((product) => {
      const name = product.name.toLowerCase();
      if (planId === "super_pro") {
        return name.includes("super pro");
      }
      if (planId === "enterprise") {
        return name.includes("enterprise");
      }
      if (planId === "government") {
        return name.includes("government") || name.includes("gov");
      }
      return false;
    })
  );
}

function findProductByTier(
  products: ListedProduct[],
  tierId: PricingTierId,
): ListedProduct | undefined {
  return (
    products.find((product) => product.metadata.tier === tierId) ??
    products.find((product) =>
      product.name.toLowerCase().includes(
        PRICING_TIERS.find((tier) => tier.id === tierId)?.name.toLowerCase() ??
          tierId,
      ),
    )
  );
}

async function ensureProductMetadata(
  product: ListedProduct,
  metadata: Record<string, string>,
): Promise<void> {
  const needsUpdate = Object.entries(metadata).some(
    ([key, value]) => product.metadata[key] !== value,
  );

  if (!needsUpdate) {
    return;
  }

  await polar.products.update({
    id: product.id,
    productUpdate: {
      metadata: {
        ...product.metadata,
        ...metadata,
      },
    },
  });

  console.log(`Updated metadata on ${product.name}`);
}

async function ensureProduct(
  existing: ListedProduct[],
  spec: ProductSpec,
  finder: (products: ListedProduct[]) => ListedProduct | undefined,
): Promise<ListedProduct> {
  let product = finder(existing);

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
    product = {
      id: created.id,
      name: created.name,
      isRecurring: created.isRecurring,
      metadata: spec.metadata,
    };
    console.log(`Created ${spec.name}: ${created.id}`);
    existing.push(product);
    return product;
  }

  console.log(`\n${spec.name}: ${product.id}`);
  await ensureProductMetadata(product, spec.metadata);
  return product;
}

async function main(): Promise<void> {
  console.log(`Polar server: ${server}`);
  console.log("Syncing NULLXES billing products via Polar Core API…\n");

  const existing = await listAllProducts();

  if (existing.length === 0) {
    console.log("No products found in this organization.");
  } else {
    for (const product of existing) {
      const plan = product.metadata.plan ? ` plan=${product.metadata.plan}` : "";
      const tier = product.metadata.tier ? ` tier=${product.metadata.tier}` : "";
      console.log(
        `- ${product.name} (${product.id})${product.isRecurring ? " [recurring]" : ""}${plan}${tier}`,
      );
    }
  }

  for (const spec of BILLING_PLAN_SPECS) {
    await ensureProduct(existing, spec, (products) =>
      findProductByPlan(products, spec.metadata.plan as BillingPlanId),
    );
  }

  for (const spec of buildSalesTierSpecs()) {
    const tierId = spec.metadata.tier as PricingTierId;
    await ensureProduct(existing, spec, (products) =>
      findProductByTier(products, tierId),
    );
  }

  const unmapped = existing.filter(
    (product) =>
      product.metadata.product !== POLAR_PRODUCT_NAMESPACE &&
      !product.metadata.plan &&
      !product.metadata.tier,
  );

  if (unmapped.length > 0) {
    console.log("\nUnmapped legacy products (safe to archive in Polar UI):");
    for (const product of unmapped) {
      console.log(`- ${product.name} (${product.id})`);
    }
  }

  console.log("\nPolar catalog is metadata-driven — no POLAR_PRODUCT_* env vars needed.");
  console.log("Required env only:");
  console.log("  POLAR_ACCESS_TOKEN");
  console.log("  POLAR_WEBHOOK_SECRET");
  console.log("  POLAR_SERVER=production");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
