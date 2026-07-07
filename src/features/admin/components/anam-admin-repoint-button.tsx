"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import { repointEmployeeAnamSlotAction } from "@/features/admin/actions/repoint-employee-anam-slot";
import type { AnamAdminEmployeeRow } from "@/features/admin/services/get-anam-pool-status";

export function AnamAdminRepointButton({
  employee,
  slot = "ANAM_API_KEY_11",
}: {
  employee: AnamAdminEmployeeRow;
  slot?: AnamApiKeySlot;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
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
              slot,
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
          `Pin to ${slot === "ANAM_API_KEY" ? "lab-1" : slot.replace("ANAM_API_KEY_", "lab-")} & reset pending`
        )}
      </Button>
      {error ? (
        <span className="text-[11px] text-white/50">{error}</span>
      ) : null}
    </div>
  );
}
