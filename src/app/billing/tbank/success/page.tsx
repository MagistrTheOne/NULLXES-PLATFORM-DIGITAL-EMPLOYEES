import { Suspense } from "react";
import { TbankSuccessClient } from "@/features/billing/tbank/tbank-success-client";

export default function TbankSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-black">
          <p className="text-2xl font-medium text-white" lang="ru">
            Оплачено
          </p>
        </main>
      }
    >
      <TbankSuccessClient />
    </Suspense>
  );
}
