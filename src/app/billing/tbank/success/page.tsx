import { Suspense } from "react";
import { TbankSuccessClient } from "@/features/billing/tbank/tbank-success-client";

export default function TbankSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
          <p className="text-3xl font-medium text-white">Оплачено</p>
        </main>
      }
    >
      <TbankSuccessClient />
    </Suspense>
  );
}
