"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  clearTbankPendingPayment,
  readOrderIdFromSearchParams,
  readPaymentIdFromSearchParams,
  readTbankPendingPayment,
} from "./pending-payment";
import {
  TbankResultGhostButton,
  TbankResultPrimaryButton,
  TbankResultShell,
} from "./tbank-result-shell";

export function TbankSuccessClient() {
  const locale = useLocale();
  const isRu = locale === "ru";
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [cancelState, setCancelState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolvePaymentId() {
      const fromUrl = readPaymentIdFromSearchParams(searchParams);
      if (fromUrl) {
        if (!cancelled) {
          setPaymentId(fromUrl);
          setResolving(false);
        }
        return;
      }

      const pending = readTbankPendingPayment();
      if (pending?.paymentId) {
        if (!cancelled) {
          setPaymentId(pending.paymentId);
          setResolving(false);
        }
        return;
      }

      const orderId =
        readOrderIdFromSearchParams(searchParams) ?? pending?.orderId ?? null;
      if (!orderId) {
        if (!cancelled) {
          setResolving(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/billing/tbank/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = (await response.json()) as {
          paymentId?: string;
          error?: string;
        };
        if (!cancelled && response.ok && data.paymentId) {
          setPaymentId(data.paymentId);
        }
      } catch {
        // Leave paymentId null — cancel stays disabled with hint.
      } finally {
        if (!cancelled) setResolving(false);
      }
    }

    void resolvePaymentId();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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
      setCancelMessage(isRu ? "Возвращен полностью" : "Fully refunded");
      clearTbankPendingPayment();
    } catch {
      setCancelState("error");
      setCancelMessage(isRu ? "Ошибка сети" : "Network error");
    }
  }

  const cancelDisabled =
    resolving ||
    !paymentId ||
    cancelState === "loading" ||
    cancelState === "done";

  return (
    <TbankResultShell
      titleRu="Оплачено"
      titleEn="Paid"
      locale={locale}
      actions={
        <>
          <TbankResultGhostButton
            disabled={cancelDisabled}
            onClick={() => void onCancel()}
          >
            {resolving
              ? isRu
                ? "Подготовка…"
                : "Preparing…"
              : cancelState === "loading"
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
      ) : !resolving && !paymentId ? (
        <p>
          {isRu
            ? "ID платежа не найден — возврат через кабинет T‑Bank → Операции."
            : "Payment ID missing — refund via T‑Bank Operations."}
        </p>
      ) : null}
    </TbankResultShell>
  );
}
