import Link from "next/link";
import { getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { FOUNDING_PARTNERS_CONTACT } from "./access";

export function FoundingPartnersGate({
  member,
}: {
  member: boolean;
}) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-black px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-18%] h-[50vh] w-[65vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_65%)]" />
      </div>

      <div className="relative w-full max-w-xl">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.28em] text-white/35">
          NULLXES
        </p>

        <div className="mt-10 rounded-3xl border border-white/8 bg-white/3 px-8 py-12 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Enterprise
          </p>
          <h1 className="mt-3 text-[1.85rem] font-medium tracking-tight text-white sm:text-[2.1rem]">
            Founding Partners
          </h1>

          {member ? <MemberBody /> : <LockedBody />}
        </div>

        <p className="mt-8 text-center text-[11px] text-white/25">
          <Link href="/settings?tab=billing" className="transition hover:text-white/45">
            ← Billing
          </Link>
        </p>
      </div>
    </main>
  );
}

async function LockedBody() {
  const locale = await getLocale();
  const isRu = locale === "ru";

  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm leading-relaxed text-white/50">
        {isRu
          ? "Закрытая программа для первых компаний, строящих цифровую рабочую силу вместе с NULLXES. Доступ только по приглашению."
          : "A closed program for the first companies building a digital workforce with NULLXES. Invitation only."}
      </p>
      <ul className="space-y-2 text-sm text-white/55">
        {(isRu
          ? [
              "Ранний доступ к возможностям платформы",
              "Влияние на развитие продукта",
              "Сопровождение архитекторов NULLXES",
              "Приоритет при внедрении",
            ]
          : [
              "Early access to platform capabilities",
              "Influence on product direction",
              "NULLXES architect support",
              "Deployment priority",
            ]
        ).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-white/25">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-white/35">
        {isRu
          ? "Доступ предоставляется только приглашённым организациям."
          : "Access is limited to invited organizations."}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="h-11 rounded-full bg-white px-6 text-black hover:bg-white/90"
          asChild
        >
          <a href={FOUNDING_PARTNERS_CONTACT}>
            {isRu ? "Запросить приглашение" : "Request an invitation"}
          </a>
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full border-white/15 bg-transparent px-6 text-white hover:bg-white/4"
          asChild
        >
          <a href={FOUNDING_PARTNERS_CONTACT}>
            {isRu ? "Связаться с NULLXES" : "Contact NULLXES"}
          </a>
        </Button>
      </div>
    </div>
  );
}

async function MemberBody() {
  const locale = await getLocale();
  const isRu = locale === "ru";

  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm leading-relaxed text-white/50">
        {isRu
          ? "Ваша организация в программе Founding Partners. Участники получают ранний доступ, влияние на продукт, сопровождение архитекторов NULLXES и приоритет при внедрении."
          : "Your organization is in the Founding Partners program. Members receive early access, product influence, NULLXES architect support, and deployment priority."}
      </p>
      <ul className="space-y-2 text-sm text-white/55">
        {(isRu
          ? [
              "Ранний доступ к новым возможностям",
              "Влияние на roadmap платформы",
              "Выделенное сопровождение архитекторов",
              "Приоритет при корпоративном внедрении",
            ]
          : [
              "Early access to new capabilities",
              "Influence on the platform roadmap",
              "Dedicated architect support",
              "Priority for enterprise deployment",
            ]
        ).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-white/25">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Button
        className="h-11 rounded-full bg-white px-6 text-black hover:bg-white/90"
        asChild
      >
        <a href={FOUNDING_PARTNERS_CONTACT}>
          {isRu ? "Связаться с командой NULLXES" : "Contact the NULLXES team"}
        </a>
      </Button>
    </div>
  );
}
