"use server";

import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { exportJob } from "@/entities/export-job/schema";
import { inngest } from "@/inngest/client";
import { db } from "@/shared/db/client";

export async function requestExportJobAction(): Promise<
  { ok: true; jobId: string } | { ok: false; message: string }
> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "Only organization owners can request exports." };
  }

  const [job] = await db
    .insert(exportJob)
    .values({
      organizationId: workspace.organization.id,
      requestedByUserId: session.user.id,
      status: "pending",
      format: "json",
    })
    .returning({ id: exportJob.id });

  if (!job) {
    return { ok: false, message: "Failed to queue export job." };
  }

  await inngest.send({
    name: "export/job.requested",
    data: { jobId: job.id, organizationId: workspace.organization.id },
  });

  return { ok: true, jobId: job.id };
}
