"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function ScenarioPostCreateSheet({
  open,
  employeeId,
  employeeName,
  onOpenChange,
}: {
  open: boolean;
  employeeId: string;
  employeeName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("employees.scenarios.postCreate");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="border-white/10 bg-[#111111] text-white sm:mx-auto sm:max-w-lg sm:rounded-t-2xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription className="text-white/55">
            {t("description", { name: employeeName })}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="mt-6 flex-row gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            className="border-white/12 bg-transparent text-white hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            {t("skip")}
          </Button>
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link href={`/dashboard/employees/${employeeId}/scenarios`}>
              {t("runScenario")}
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
