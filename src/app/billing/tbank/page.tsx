import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/services/get-current-session";
import { isTbankConfigured } from "@/features/billing/tbank/config";
import { TbankPayButton } from "@/features/billing/tbank/tbank-pay-button";
import { Button } from "@/components/ui/button";

/**
 * Auditor / merchant test “cart”: one virtual item → T-Bank payment form.
 * Login required (acquiring@nullxes.com for bank review).
 */
export default async function TbankPayPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/billing/tbank")}`);
  }

  const configured = isTbankConfigured();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
        NULLXES · Тестовая оплата
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-white">
        Оформление
      </h1>
      <div className="rounded-2xl border border-white/10 bg-white/3 p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">
              Подписка NULLXES (тест)
            </p>
            <p className="mt-1 text-xs text-white/45">
              Init + Receipt (54‑ФЗ) · терминал DEMO
            </p>
          </div>
          <p className="text-lg font-medium text-white">10 ₽</p>
        </div>
      </div>
      <p className="text-sm text-white/55">
        После «Оплатить» откроется форма T‑Bank. Для чека используйте карту
        4000 0000 0000 0101; для чека возврата — 5000 0000 0000 0108, затем
        «Отменить платёж» на экране успеха.
      </p>
      {configured ? (
        <TbankPayButton
          label="Оплатить"
          className="w-full justify-center border-white/20 bg-white text-black hover:bg-white/90"
        />
      ) : (
        <p className="text-sm text-white/55">
          T‑Bank не настроен (нет TerminalKey / пароля на сервере).
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="border-white/15 bg-transparent text-white/70 hover:bg-white/5"
        asChild
      >
        <Link href="/settings?tab=billing">Биллинг</Link>
      </Button>
    </main>
  );
}
