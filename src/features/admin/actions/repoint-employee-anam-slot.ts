"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/services/require-auth";
import { isPlatformAdminEmail } from "@/features/admin/lib/is-platform-admin";
import type { AnamApiKeySlot } from "@/shared/config/anam-api-pool";
import { repointEmployeeAnamSlot } from "@/features/provider-provisioning/services/repoint-employee-anam-slot";

export async function repointEmployeeAnamSlotAction(input: {
  employeeId: string;
  slot: AnamApiKeySlot;
  enqueueProvisioning?: boolean;
}): Promise<
  | {
      ok: true;
      employeeName: string;
      slot: AnamApiKeySlot;
      previousSlot: string | null;
    }
  | { ok: false; message: string }
> {
  try {
    const session = await requireAuth();
    if (!isPlatformAdminEmail(session.user.email)) {
      return { ok: false, message: "Platform admin access required." };
    }

    const result = await repointEmployeeAnamSlot({
      employeeId: input.employeeId.trim(),
      slot: input.slot,
      enqueueProvisioning: input.enqueueProvisioning ?? false,
    });

    revalidatePath("/dashboard/admin/anam");
    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${input.employeeId}`);

    return {
      ok: true,
      employeeName: result.employeeName,
      slot: result.slot,
      previousSlot: result.previousSlot,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Repoint failed",
    };
  }
}
