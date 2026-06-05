import { eq } from "drizzle-orm";
import { exportJob } from "@/entities/export-job/schema";
import { db } from "@/shared/db/client";
import { inngest } from "../client";

export const processExportJob = inngest.createFunction(
  {
    id: "export-job-process",
    triggers: [{ event: "export/job.requested" }],
  },
  async ({ event, step }) => {
    const jobId = event.data.jobId as string;

    await step.run("mark-processing", async () => {
      await db
        .update(exportJob)
        .set({ status: "processing" })
        .where(eq(exportJob.id, jobId));
    });

    await step.run("build-export", async () => {
      await db
        .update(exportJob)
        .set({
          status: "ready",
          completedAt: new Date(),
          downloadToken: crypto.randomUUID(),
          downloadExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        })
        .where(eq(exportJob.id, jobId));
    });
  },
);
