import Link from "next/link";
import { getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function TbankFailPage() {
  const locale = await getLocale();
  const isRu = locale === "ru";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
        NULLXES · T‑Bank
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-white">
        {isRu ? "Не получилось оплатить" : "Payment failed"}
      </h1>
      {!isRu ? (
        <p className="text-sm text-white/45" lang="ru">
          Не получилось оплатить
        </p>
      ) : null}
      <p className="text-sm text-white/55">
        {isRu
          ? "Тестовый отказ по карте обработан. Можно вернуться и повторить сценарий."
          : "Card decline handled. You can retry the test scenario."}
      </p>
      <div className="flex justify-center">
        <Button
          type="button"
          className="bg-white text-black hover:bg-white/90"
          asChild
        >
          <Link href="/settings?tab=billing">
            {isRu ? "К биллингу" : "Back to billing"}
          </Link>
        </Button>
      </div>
    </main>
  );
}
