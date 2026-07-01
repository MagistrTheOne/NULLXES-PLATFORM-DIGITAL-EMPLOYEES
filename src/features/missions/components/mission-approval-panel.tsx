"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resolveApprovalAction } from "@/features/agent-approval/actions/resolve-approval";
import type { MissionPendingApproval } from "../queries/get-pending-mission-approval";

export function MissionApprovalPanel({
  approval,
  canManage,
}: {
  approval: MissionPendingApproval;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleResolve(decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await resolveApprovalAction({
        approvalId: approval.id,
        decision,
      });

      if (result.ok) {
        router.refresh();
      }
    });
  }

  const leadCount =
    typeof approval.payload.leadCount === "number"
      ? approval.payload.leadCount
      : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
      <h2 className="text-sm font-medium text-white">Approval required</h2>
      <p className="mt-2 text-sm text-white/60">
        {leadCount ?? "Multiple"} proposal drafts are ready for review. Approve to
        send outbound emails via Resend automation, or reject to cancel this mission.
      </p>
      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleResolve("rejected")}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            Reject
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => handleResolve("approved")}
            className="bg-white text-black hover:bg-white/90"
          >
            {isPending ? "Processing..." : "Approve & send"}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/50">
          Only organization owners can approve mission outbound.
        </p>
      )}
    </section>
  );
}
