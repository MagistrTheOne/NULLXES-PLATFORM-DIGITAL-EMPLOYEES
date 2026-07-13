import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TbankResultShell({
  titleRu,
  titleEn,
  locale,
  eyebrowRu,
  eyebrowEn,
  children,
  actions,
}: {
  /** Exact bank-auditor string (must stay Russian). */
  titleRu: string;
  /** Optional EN gloss under the Russian H1 (EN locale only). */
  titleEn?: string;
  locale: string;
  eyebrowRu?: string;
  eyebrowEn?: string;
  children?: ReactNode;
  actions: ReactNode;
}) {
  const isRu = locale === "ru";
  const eyebrow = isRu ? eyebrowRu : eyebrowEn;

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-black px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[55vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_40%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.28em] text-white/35">
          NULLXES
        </p>

        <div className="mt-10 rounded-3xl border border-white/8 bg-white/3 px-8 py-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-medium tracking-tight text-white",
              eyebrow
                ? "mt-3 text-[1.85rem] sm:text-[2.1rem]"
                : "text-[2rem] sm:text-[2.35rem]",
            )}
            lang="ru"
          >
            {titleRu}
          </h1>
          {!isRu && titleEn ? (
            <p className="mt-2 text-sm text-white/40">{titleEn}</p>
          ) : null}

          {children ? (
            <div className="mt-5 space-y-3 text-sm leading-relaxed text-white/50">
              {children}
            </div>
          ) : null}

          <div
            className={cn(
              "mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center",
            )}
          >
            {actions}
          </div>
        </div>
      </div>
    </main>
  );
}

export function TbankResultPrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      className="h-11 rounded-full bg-white px-6 text-black hover:bg-white/90"
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function TbankResultGhostButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-11 rounded-full border-white/15 bg-transparent px-6 text-white hover:bg-white/4 disabled:opacity-40"
    >
      {children}
    </Button>
  );
}
