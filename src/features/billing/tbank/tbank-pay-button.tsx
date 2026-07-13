"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BillingInterval } from "@/features/billing/config/plans";
import type { SelfServeCheckoutPlanId } from "@/features/billing/config/rub-pricing";
import { stashTbankPendingPayment } from "./pending-payment";

export function TbankPayButton({
  label,
  className,
  planId,
  interval = "month",
  pendingLabel,
}: {
  label: string;
  className?: string;
  planId?: SelfServeCheckoutPlanId | "test";
  interval?: BillingInterval;
  pendingLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/tbank/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planId === "test" ? undefined : planId,
          interval,
        }),
      });
      const data = (await response.json()) as {
        paymentUrl?: string;
        paymentId?: string | number;
        orderId?: string;
        error?: string;
        details?: string;
      };
      if (!response.ok || !data.paymentUrl) {
        setError(
          [data.error, data.details].filter(Boolean).join(" — ") ||
            "Payment failed",
        );
        setPending(false);
        return;
      }
      if (data.paymentId != null) {
        stashTbankPendingPayment({
          paymentId: data.paymentId,
          orderId: data.orderId,
        });
      }
      window.location.assign(data.paymentUrl);
    } catch {
      setError("Network error");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={pending}
        onClick={() => void startPayment()}
      >
        {pending ? (pendingLabel ?? "…") : label}
      </Button>
      {error ? (
        <p className="max-w-sm text-left text-xs text-muted-foreground sm:text-right">
          {error}
        </p>
      ) : null}
    </div>
  );
}
