export function buildPolarCheckoutUrl(input: {
  productId: string;
  organizationId: string;
  customerEmail?: string;
}): string {
  const params = new URLSearchParams({
    products: input.productId,
    customerExternalId: input.organizationId,
  });

  if (input.customerEmail) {
    params.set("customerEmail", input.customerEmail);
  }

  return `/api/checkout?${params.toString()}`;
}
