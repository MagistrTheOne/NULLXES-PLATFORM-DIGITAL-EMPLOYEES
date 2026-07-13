"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  TbankResultGhostButton,
  TbankResultPrimaryButton,
  TbankResultShell,
} from "./tbank-result-shell";

export function TbankSuccessClient() {
  const locale = useLocale();
  const isRu = locale === "ru";
  const searchParams = useSearchParams();
  const paymentId =
    searchParams.get("PaymentId") ?? searchParams.get("paymentId");
  const [cancelState, setCancelState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  async function onCancel() {
    if (!paymentId) {
      setCancelState("error");
      setCancelMessage(isRu ? "Платёж не найден" : "Payment not found");
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
        setCancelMessage(
          data.error ?? (isRu ? "Не удалось отменить" : "Cancel failed"),
        );
        return;
      }
      setCancelState("done");
      setCancelMessage(
        isRu ? "Возвращен полностью" : "Fully refunded",
      );
    } catch {
      setCancelState("error");
      setCancelMessage(isRu ? "Ошибка сети" : "Network error");
    }
  }

  return (
    <TbankResultShell
      titleRu="Оплачено"
      titleEn="Paid"
      locale={locale}
      actions={
        <>
          <TbankResultGhostButton
            disabled={
              !paymentId || cancelState === "loading" || cancelState === "done"
            }
            onClick={() => void onCancel()}
          >
            {cancelState === "loading"
              ? isRu
                ? "Отмена…"
                : "Cancelling…"
              : cancelState === "done"
                ? isRu
                  ? "Возвращен"
                  : "Refunded"
                : isRu
                  ? "Отменить платёж"
                  : "Cancel payment"}
          </TbankResultGhostButton>
          <TbankResultPrimaryButton href="/settings?tab=billing">
            {isRu ? "К биллингу" : "Back to billing"}
          </TbankResultPrimaryButton>
        </>
      }
    >
      {cancelMessage ? (
        <p className={cancelState === "error" ? "text-white/70" : undefined}>
          {cancelMessage}
        </p>
      ) : null}
    </TbankResultShell>
  );
}
