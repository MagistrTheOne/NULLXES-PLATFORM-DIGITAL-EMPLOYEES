import { and, eq } from "drizzle-orm";
import { exportJob } from "@/entities/export-job/schema";
import { requireAuth } from "@/features/auth/services/require-auth";
import { ensureWorkspace } from "@/features/auth/services/ensure-workspace";
import { recordAuditEvent } from "@/features/security/services/record-audit-event";
import { decryptField } from "@/shared/crypto/field-encryption";
import { timingSafeStringEqual } from "@/shared/crypto/timing-safe-compare";
import { withTenantContext } from "@/shared/db/with-tenant-context";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  const { jobId } = await params;
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return Response.json(
      { error: "Download token is required." },
      { status: 400 },
    );
  }

  const session = await requireAuth();
  const workspace = await ensureWorkspace(session.user.id, session.user.name);

  if (!workspace.permissions.canManageOrganization) {
    return Response.json(
      { error: "You do not have permission to download exports." },
      { status: 403 },
    );
  }

  return withTenantContext(workspace.organization.id, async (tx) => {
    const [job] = await tx
      .select()
      .from(exportJob)
      .where(
        and(
          eq(exportJob.id, jobId),
          eq(exportJob.organizationId, workspace.organization.id),
        ),
      )
      .limit(1);

    if (!job) {
      return Response.json({ error: "Export not found." }, { status: 404 });
    }

    if (job.status === "failed") {
      return Response.json(
        { error: job.errorMessage ?? "Export failed." },
        { status: 410 },
      );
    }

    if (job.status !== "ready" || !job.payloadPath) {
      return Response.json(
        { error: "Export is still being prepared." },
        { status: 202 },
      );
    }

    if (job.downloadExpiresAt && job.downloadExpiresAt.getTime() < Date.now()) {
      return Response.json({ error: "Export link has expired." }, { status: 410 });
    }

    const expectedToken = job.downloadToken
      ? decryptField(job.downloadToken)
      : null;
    if (!timingSafeStringEqual(expectedToken, token)) {
      return Response.json({ error: "Invalid download token." }, { status: 403 });
    }

    const payload = decryptField(job.payloadPath);
    if (!payload) {
      return Response.json({ error: "Export is unavailable." }, { status: 410 });
    }

    recordAuditEvent({
      organizationId: workspace.organization.id,
      actorUserId: session.user.id,
      actorRole: workspace.membership.role,
      action: "data.exported",
      resourceType: "export_job",
      resourceId: job.id,
    });

    const fileName = `nullxes-workspace-export-${job.id.slice(0, 8)}.json`;

    return new Response(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
