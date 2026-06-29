"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useWorkspaceBilling } from "@/features/workspace/components/workspace-billing-provider";

export function EmployeeCreateUpgradeDialog({
  open,
  onOpenChange,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "employee_limit" | "custom_avatar";
}) {
  const t = useTranslations("employees.create.upgradeGate");
  const { checkoutUrl } = useWorkspaceBilling();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#111111] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {reason === "employee_limit" ? t("limitTitle") : t("avatarTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/55">
            {reason === "employee_limit" ? t("limitDescription") : t("avatarDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/12 bg-transparent text-white hover:bg-white/5">
            {t("cancel")}
          </AlertDialogCancel>
          {checkoutUrl ? (
            <Button asChild className="bg-white text-black hover:bg-white/90">
              <Link href={checkoutUrl}>{t("upgrade")}</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-white/12 text-white">
              <Link href="/settings?tab=billing">{t("billing")}</Link>
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
