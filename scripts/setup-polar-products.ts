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

async function listAllProducts(): Promise<
  Array<{ id: string; name: string; isRecurring: boolean }>
> {
  const products: Array<{ id: string; name: string; isRecurring: boolean }> =
    [];

  const iterator = await polar.products.list({});
  for await (const page of iterator) {
    for (const product of page.result.items) {
      products.push({
        id: product.id,
        name: product.name,
        isRecurring: product.isRecurring,
      });
    }
  }

  return products;
}

async function main(): Promise<void> {
  console.log(`Polar server: ${server}`);
  console.log("Listing existing products (old projects are preserved)…\n");

  const existing = await listAllProducts();

  if (existing.length === 0) {
    console.log("No products found in this organization.");
  } else {
    for (const product of existing) {
      console.log(
        `- ${product.name} (${product.id})${product.isRecurring ? " [recurring]" : ""}`,
      );
    }
  }

  const superProName = "NULLXES Super Pro";
  const hasSuperPro = existing.some(
    (product) =>
      product.name === superProName ||
      product.name.toLowerCase().includes("super pro"),
  );

  let superProId: string | undefined = existing.find(
    (product) => product.name === superProName,
  )?.id;

  if (!hasSuperPro) {
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
    superProId = created.id;
    console.log(`Created Super Pro product: ${created.id}`);
  } else if (superProId) {
    console.log(`\nSuper Pro product already exists: ${superProId}`);
  } else {
    const match = existing.find((product) =>
      product.name.toLowerCase().includes("super pro"),
    );
    superProId = match?.id;
    console.log(`\nUsing existing Super Pro-like product: ${superProId}`);
  }

  console.log("\nAdd these to .env:\n");
  if (superProId) {
    console.log(`POLAR_PRODUCT_SUPER_PRO_ID=${superProId}`);
  }
  console.log(
    "# Free / Enterprise / Government are contact or in-app only — no checkout product required.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
