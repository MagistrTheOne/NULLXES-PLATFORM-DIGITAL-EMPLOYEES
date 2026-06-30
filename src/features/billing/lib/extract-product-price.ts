type PolarPrice = {
  id: string;
  isArchived?: boolean;
  amountType?: string;
  priceAmount?: number;
  priceCurrency?: string;
  amount?: number;
  currency?: string;
};

type PolarProductLike = {
  prices: PolarPrice[];
};

export type ExtractedProductPrice = {
  amountCents: number;
  currency: string;
  priceId: string;
};

export function extractPrimaryProductPrice(
  product: PolarProductLike,
): ExtractedProductPrice | null {
  for (const price of product.prices) {
    if (price.isArchived) {
      continue;
    }

    if (price.amountType === "fixed") {
      const amountCents = price.priceAmount ?? price.amount;
      if (amountCents == null) {
        continue;
      }

      return {
        amountCents,
        currency: price.priceCurrency ?? price.currency ?? "usd",
        priceId: price.id,
      };
    }

    if (price.amountType === "free") {
      return {
        amountCents: 0,
        currency: "usd",
        priceId: price.id,
      };
    }
  }

  return null;
}
