import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

export async function AuthPageShell({ children }: { children: ReactNode }) {
  const t = await getTranslations("auth");

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-black px-6 py-16">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-xs tracking-[0.3em] text-white/50 uppercase">
          {t("brand")}
        </p>
        {children}
      </div>
    </main>
  );
}
