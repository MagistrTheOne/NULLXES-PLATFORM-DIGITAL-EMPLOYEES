import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TbankFailPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
        NULLXES · T‑Bank
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-white">
        Не получилось оплатить
      </h1>
      <p className="text-sm text-white/55">
        Тестовый отказ по карте обработан. Можно вернуться и повторить сценарий.
      </p>
      <div className="flex justify-center">
        <Button
          type="button"
          className="bg-white text-black hover:bg-white/90"
          asChild
        >
          <Link href="/settings?tab=billing">К биллингу</Link>
        </Button>
      </div>
    </main>
  );
}
