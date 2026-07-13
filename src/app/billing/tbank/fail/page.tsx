import { getLocale } from "next-intl/server";
import {
  TbankResultPrimaryButton,
  TbankResultShell,
} from "@/features/billing/tbank/tbank-result-shell";

export default async function TbankFailPage() {
  const locale = await getLocale();
  const isRu = locale === "ru";

  return (
    <TbankResultShell
      titleRu="Не получилось оплатить"
      titleEn="Payment failed"
      locale={locale}
      actions={
        <TbankResultPrimaryButton href="/billing/tbank">
          {isRu ? "Повторить" : "Try again"}
        </TbankResultPrimaryButton>
      }
    />
  );
}
