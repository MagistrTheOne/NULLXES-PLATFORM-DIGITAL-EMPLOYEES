"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TbankSuccessClient() {
  const searchParams = useSearchParams();
  const paymentId =
    searchParams.get("PaymentId") ?? searchParams.get("paymentId");
  const orderId = searchParams.get("OrderId") ?? searchParams.get("orderId");
  const [cancelState, setCancelState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  async function onCancel() {
    if (!paymentId) {
      setCancelState("error");
      setCancelMessage("PaymentId не найден в URL");
      return;
    }

    setCancelState("loading");
    setCancelMessage(null);

    try {
      const response = await fetch("/api/billing/tbank/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = (await response.json()) as {
        error?: string;
        status?: string;
      };
      if (!response.ok) {
        setCancelState("error");
        setCancelMessage(data.error ?? "Не удалось отменить платёж");
        return;
      }
      setCancelState("done");
      setCancelMessage(
        data.status
          ? `Статус: ${data.status} (ожидается возврат полностью)`
          : "Возврат отправлен",
      );
    } catch {
      setCancelState("error");
      setCancelMessage("Сеть: не удалось вызвать Cancel");
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
        NULLXES · T‑Bank
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-white">
        Оплачено
      </h1>
      <p className="text-sm text-white/55">
        Тестовый платёж прошёл успешно. Для теста возврата нажмите «Отменить
        платёж» (метод Cancel).
      </p>
      {(paymentId || orderId) && (
        <p className="font-mono text-xs text-white/40">
          {paymentId ? `PaymentId: ${paymentId}` : null}
          {paymentId && orderId ? " · " : null}
          {orderId ? `OrderId: ${orderId}` : null}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-transparent text-white hover:bg-white/5"
          disabled={!paymentId || cancelState === "loading" || cancelState === "done"}
          onClick={() => void onCancel()}
        >
          {cancelState === "loading"
            ? "Отмена…"
            : cancelState === "done"
              ? "Возвращен"
              : "Отменить платёж"}
        </Button>
        <Button
          type="button"
          className="bg-white text-black hover:bg-white/90"
          asChild
        >
          <Link href="/settings?tab=billing">К биллингу</Link>
        </Button>
      </div>
      {cancelMessage ? (
        <p
          className={
            cancelState === "error"
              ? "text-sm text-white/70"
              : "text-sm text-white/55"
          }
        >
          {cancelMessage}
        </p>
      ) : null}
    </main>
  );
}
