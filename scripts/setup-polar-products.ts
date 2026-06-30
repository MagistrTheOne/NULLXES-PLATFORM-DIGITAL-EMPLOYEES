import { Polar } from "@polar-sh/sdk";
import { BILLING_PLANS } from "../src/features/billing/config/plans";

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

function findProductByPlan(
  products: ListedProduct[],
  planId: string,
): ListedProduct | undefined {
  return (
    products.find((product) => product.metadata.plan === planId) ??
    products.find((product) => {
      const name = product.name.toLowerCase();
      if (planId === "super_pro") {
        return name.includes("super pro");
      }
      if (planId === "enterprise") {
        return name === "enterprise";
      }
      if (planId === "government") {
        return name.includes("government") || name.includes("gov");
      }
      return false;
    })
  );
}

async function ensureProductMetadata(
  product: ListedProduct,
  planId: string,
): Promise<void> {
  if (product.metadata.plan === planId) {
    return;
  }

  await polar.products.update({
    id: product.id,
    productUpdate: {
      metadata: {
        ...product.metadata,
        plan: planId,
        product: "nullxes_digital_employees",
      },
    },
  });

  console.log(`Updated metadata.plan=${planId} on ${product.name}`);
}

async function main(): Promise<void> {
  console.log(`Polar server: ${server}`);
  console.log("Listing existing products (old projects are preserved)…\n");

  const existing = await listAllProducts();

  if (existing.length === 0) {
    console.log("No products found in this organization.");
  } else {
    for (const product of existing) {
      const plan = product.metadata.plan ? ` plan=${product.metadata.plan}` : "";
      console.log(
        `- ${product.name} (${product.id})${product.isRecurring ? " [recurring]" : ""}${plan}`,
      );
    }
  }

  const superProName = "NULLXES Super Pro";
  let superPro = findProductByPlan(existing, "super_pro");

  if (!superPro) {
    console.log(`\nCreating "${superProName}" ($950/mo)…`);
    const created = await polar.products.create({
      name: superProName,
      description: BILLING_PLANS.super_pro.description,
      recurringInterval: "month",
      prices: [
        {
          amountType: "fixed",
          priceCurrency: "usd",
          priceAmount: 95_000,
        },
      ],
      metadata: {
        plan: "super_pro",
        product: "nullxes_digital_employees",
      },
    });
    superPro = {
      id: created.id,
      name: created.name,
      isRecurring: created.isRecurring,
      metadata: { plan: "super_pro", product: "nullxes_digital_employees" },
    };
    console.log(`Created Super Pro product: ${created.id}`);
  } else {
    console.log(`\nSuper Pro product: ${superPro.id}`);
    await ensureProductMetadata(superPro, "super_pro");
  }

  const enterprise = findProductByPlan(existing, "enterprise");
  if (enterprise) {
    console.log(`Enterprise product: ${enterprise.id}`);
    await ensureProductMetadata(enterprise, "enterprise");
  }

  console.log("\nAdd these to .env / Vercel:\n");
  console.log(`POLAR_PRODUCT_SUPER_PRO_ID=${superPro.id}`);
  if (enterprise) {
    console.log(`POLAR_PRODUCT_ENTERPRISE_ID=${enterprise.id}`);
  }
  console.log(
    "# Government stays sales-led unless you create a Polar product with metadata.plan=government",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
