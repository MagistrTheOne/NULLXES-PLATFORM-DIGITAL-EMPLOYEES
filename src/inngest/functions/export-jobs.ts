import { eq } from "drizzle-orm";
import { exportJob } from "@/entities/export-job/schema";
import { buildOrganizationExportPayload } from "@/features/settings/services/build-organization-export";
import { encryptField } from "@/shared/crypto/field-encryption";
import { db } from "@/shared/db/client";
import { inngest } from "../client";

export const processExportJob = inngest.createFunction(
  {
    id: "export-job-process",
    triggers: [{ event: "export/job.requested" }],
  },
  async ({ event, step }) => {
    const jobId = event.data.jobId as string;
    const organizationId = event.data.organizationId as string;

    await step.run("mark-processing", async () => {
      await db
        .update(exportJob)
        .set({ status: "processing" })
        .where(eq(exportJob.id, jobId));
    });

    try {
      const payload = await step.run("build-export", async () =>
        buildOrganizationExportPayload(organizationId),
      );

      await step.run("store-export", async () => {
        const downloadToken = crypto.randomUUID();
        await db
          .update(exportJob)
          .set({
            status: "ready",
            completedAt: new Date(),
            payloadPath: encryptField(payload),
            downloadToken: encryptField(downloadToken),
            downloadExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            errorMessage: null,
          })
          .where(eq(exportJob.id, jobId));
      });
    } catch (error: unknown) {
      await step.run("mark-failed", async () => {
        await db
          .update(exportJob)
          .set({
            status: "failed",
            completedAt: new Date(),
            errorMessage:
              error instanceof Error ? error.message : "Export build failed",
          })
          .where(eq(exportJob.id, jobId));
      });
      throw error;
    }
  },
);
