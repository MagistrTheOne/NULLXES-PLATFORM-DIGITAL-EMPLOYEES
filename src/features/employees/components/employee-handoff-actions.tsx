"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveHandoffAction } from "../actions/resolve-handoff-action";
import type { EmployeeHandoffItem } from "../types";

export function EmployeeHandoffActions({
  handoff,
  canManage,
}: {
  handoff: EmployeeHandoffItem;
  canManage: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("employees.detail.handoffs");
  const [isPending, startTransition] = useTransition();

  if (
    !canManage ||
    handoff.direction !== "incoming" ||
    handoff.status !== "pending"
  ) {
    return null;
  }

  function handleDecision(decision: "accepted" | "rejected"): void {
    startTransition(async () => {
      await resolveHandoffAction({ handoffId: handoff.id, decision });
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        className="bg-white text-black hover:bg-white/90"
        disabled={isPending}
        onClick={() => handleDecision("accepted")}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : t("accept")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-white/12 text-white"
        disabled={isPending}
        onClick={() => handleDecision("rejected")}
      >
        {t("reject")}
      </Button>
    </div>
  );
}
