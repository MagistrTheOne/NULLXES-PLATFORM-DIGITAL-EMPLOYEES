"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { isTransientDatabaseError } from "@/shared/errors/is-transient-database-error";

export default function ConversationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("conversations.error");
  const isDatabaseUnavailable = isTransientDatabaseError(error);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-medium text-white">{t("title")}</h1>
      <p className="text-sm leading-relaxed text-white/55">
        {isDatabaseUnavailable ? t("database") : t("generic")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          {t("tryAgain")}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">{t("backToDashboard")}</Link>
        </Button>
      </div>
    </div>
  );
}
