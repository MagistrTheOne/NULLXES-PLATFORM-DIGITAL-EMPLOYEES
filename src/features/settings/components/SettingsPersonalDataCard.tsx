"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/features/auth/client";
import {
  deleteUserAccountAction,
  exportUserPersonalDataAction,
} from "@/features/privacy/actions/personal-data-actions";
import { SettingsCard } from "./settings-card";

export function SettingsPersonalDataCard() {
  const t = useTranslations("settings.personalData");
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleExport(): void {
    startTransition(async () => {
      const result = await exportUserPersonalDataAction();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      const blob = new Blob([result.payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nullxes-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(t("exported"));
    });
  }

  function handleDeleteAccount(): void {
    startTransition(async () => {
      const result = await deleteUserAccountAction();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <SettingsCard title={t("title")} description={t("description")}>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleExport}
        >
          {t("export")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {t("deleteAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteAccountTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteAccountDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder={t("deleteAccountConfirmPlaceholder")}
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm("")}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteConfirm !== "DELETE" || isPending}
                onClick={handleDeleteAccount}
              >
                {t("deleteAccountConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </SettingsCard>
  );
}
