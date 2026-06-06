import { inngest } from "@/inngest/client";
import {
  markKnowledgeFailed,
  markKnowledgeReady,
  startKnowledgeProcessing,
} from "@/features/knowledge-processing";
import { rechunkAndEmbedSource } from "@/features/knowledge-retrieval";

export const processKnowledgeSource = inngest.createFunction(
  {
    id: "knowledge-ingestion-process-source",
    triggers: [{ event: "knowledge/source.pending" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { sourceId } = event.data as { sourceId: string };

    await step.run("start-processing", async () => {
      await startKnowledgeProcessing({ sourceId });
    });

    try {
      const embeddedCount = await step.run("embed-chunks", async () =>
        rechunkAndEmbedSource(sourceId),
      );

      await step.run("mark-ready", async () => {
        await markKnowledgeReady({ sourceId });
      });

      return { sourceId, embeddedCount, status: "ready" as const };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Knowledge ingestion failed";

      await step.run("mark-failed", async () => {
        await markKnowledgeFailed({ sourceId, failureReason: message });
      });

      await step.run("emit-failure-event", async () => {
        await inngest.send({
          name: "knowledge/processing.failed",
          data: { sourceId, reason: message },
        });
      });

      throw error;
    }
  },
);
