"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TbankPayButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/tbank/init", {
        method: "POST",
      });
      const data = (await response.json()) as {
        paymentUrl?: string;
        error?: string;
        details?: string;
      };
      if (!response.ok || !data.paymentUrl) {
        setError(
          [data.error, data.details].filter(Boolean).join(" — ") ||
            "Не удалось создать платёж",
        );
        setPending(false);
        return;
      }
      window.location.assign(data.paymentUrl);
    } catch {
      setError("Сеть: не удалось создать платёж");
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
        {pending ? "Переход…" : label}
      </Button>
      {error ? (
        <p className="max-w-sm text-left text-xs text-muted-foreground sm:text-right">
          {error}
        </p>
      ) : null}
    </div>
  );
}
