"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import { repointEmployeeAnamSlotAction } from "@/features/admin/actions/repoint-employee-anam-slot";
import type { AnamAdminEmployeeRow } from "@/features/admin/services/get-anam-pool-status";

function slotShortLabel(slot: AnamApiKeySlot, label: string): string {
  return `${label} (${slot})`;
}

export function AnamAdminRepointButton({
  employee,
  slotOptions,
}: {
  employee: AnamAdminEmployeeRow;
  slotOptions: Array<{ slot: AnamApiKeySlot; label: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultSlot = slotOptions[0]?.slot ?? "ANAM_API_KEY";
  const [targetSlot, setTargetSlot] = useState<AnamApiKeySlot>(defaultSlot);

  if (slotOptions.length === 0) {
    return (
      <p className="mt-2 text-[11px] text-white/45">
        No configured Anam keys to pin to.
      </p>
    );
  }

  const selectedLabel =
    slotOptions.find((option) => option.slot === targetSlot)?.label ?? "lab";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Select
        value={targetSlot}
        onValueChange={(value) => setTargetSlot(value as AnamApiKeySlot)}
        disabled={isPending}
      >
        <SelectTrigger
          size="sm"
          className="h-7 min-w-40 border-white/12 bg-transparent text-[11px] text-white/70"
        >
          <SelectValue placeholder="Target slot" />
        </SelectTrigger>
        <SelectContent>
          {slotOptions.map((option) => (
            <SelectItem key={option.slot} value={option.slot}>
              {slotShortLabel(option.slot, option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        className="h-7 border-white/12 bg-transparent px-2 text-[11px] text-white/70"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await repointEmployeeAnamSlotAction({
              employeeId: employee.id,
              slot: targetSlot,
              enqueueProvisioning: false,
            });

            if (!result.ok) {
              setError(result.message);
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          `Pin to ${selectedLabel} & reset pending`
        )}
      </Button>
      {error ? (
        <span className="text-[11px] text-white/50">{error}</span>
      ) : null}
    </div>
  );
}
