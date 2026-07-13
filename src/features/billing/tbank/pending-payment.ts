/** Browser stash so Cancel works even if SuccessURL loses PaymentId. */
export const TBANK_PENDING_PAYMENT_KEY = "nullxes.tbank.pendingPayment";

export type TbankPendingPayment = {
  paymentId: string;
  orderId?: string;
  createdAt: number;
};

export function stashTbankPendingPayment(input: {
  paymentId: string | number;
  orderId?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const payload: TbankPendingPayment = {
    paymentId: String(input.paymentId),
    orderId: input.orderId ? String(input.orderId) : undefined,
    createdAt: Date.now(),
  };
  try {
    window.sessionStorage.setItem(
      TBANK_PENDING_PAYMENT_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Ignore quota / private mode.
  }
}

export function readTbankPendingPayment(): TbankPendingPayment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TBANK_PENDING_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TbankPendingPayment;
    if (!parsed?.paymentId) return null;
    // Drop stale entries older than 2 hours.
    if (Date.now() - (parsed.createdAt ?? 0) > 2 * 60 * 60 * 1000) {
      window.sessionStorage.removeItem(TBANK_PENDING_PAYMENT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearTbankPendingPayment(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TBANK_PENDING_PAYMENT_KEY);
  } catch {
    // ignore
  }
}

export function readPaymentIdFromSearchParams(
  searchParams: URLSearchParams,
): string | null {
  const keys = [
    "PaymentId",
    "paymentId",
    "payment_id",
    "PaymentID",
  ];
  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }
  return null;
}

export function readOrderIdFromSearchParams(
  searchParams: URLSearchParams,
): string | null {
  const keys = ["OrderId", "orderId", "order_id"];
  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }
  return null;
}
