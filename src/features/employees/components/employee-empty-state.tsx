"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function EmployeeEmptyState({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  const t = useTranslations("employees.list");
  const tCommon = useTranslations("common.actions");

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-white/60">{t("empty")}</p>
      <Button
        type="button"
        size="sm"
        onClick={onCreateClick}
        className="bg-white text-black hover:bg-white/90"
      >
        {tCommon("createEmployee")}
      </Button>
    </div>
  );
}
