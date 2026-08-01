"use server";

import { and, eq } from "drizzle-orm";
import { exportJob } from "@/entities/export-job/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { decryptField } from "@/shared/crypto/field-encryption";
import { withTenantContext } from "@/shared/db/with-tenant-context";

export type ExportJobStatusResult =
  | {
      ok: true;
      status: "pending" | "processing" | "ready" | "failed";
      downloadUrl: string | null;
      errorMessage: string | null;
    }
  | { ok: false; message: string };

export async function getExportJobStatusAction(
  jobId: string,
): Promise<ExportJobStatusResult> {
  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return { ok: false, message: "Only organization owners can view exports." };
  }

  const trimmedId = jobId.trim();
  if (!trimmedId) {
    return { ok: false, message: "Export job id is required." };
  }

  return withTenantContext(workspace.organization.id, async (tx) => {
    const [job] = await tx
      .select({
        id: exportJob.id,
        status: exportJob.status,
        downloadToken: exportJob.downloadToken,
        downloadExpiresAt: exportJob.downloadExpiresAt,
        errorMessage: exportJob.errorMessage,
        payloadPath: exportJob.payloadPath,
      })
      .from(exportJob)
      .where(
        and(
          eq(exportJob.id, trimmedId),
          eq(exportJob.organizationId, workspace.organization.id),
        ),
      )
      .limit(1);

    if (!job) {
      return { ok: false, message: "Export not found." };
    }

    if (job.status === "failed") {
      return {
        ok: true,
        status: "failed",
        downloadUrl: null,
        errorMessage: job.errorMessage ?? "Export failed.",
      };
    }

    if (job.status === "ready" && job.payloadPath) {
      if (
        job.downloadExpiresAt &&
        job.downloadExpiresAt.getTime() < Date.now()
      ) {
        return {
          ok: true,
          status: "failed",
          downloadUrl: null,
          errorMessage: "Export link has expired. Queue a new export.",
        };
      }

      const token = job.downloadToken
        ? decryptField(job.downloadToken)
        : null;
      if (!token) {
        return {
          ok: true,
          status: "failed",
          downloadUrl: null,
          errorMessage: "Export is unavailable.",
        };
      }

      return {
        ok: true,
        status: "ready",
        downloadUrl: `/api/settings/export/${job.id}?token=${encodeURIComponent(token)}`,
        errorMessage: null,
      };
    }

    return {
      ok: true,
      status: job.status === "processing" ? "processing" : "pending",
      downloadUrl: null,
      errorMessage: null,
    };
  });
}
