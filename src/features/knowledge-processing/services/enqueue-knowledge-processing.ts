import { inngest, isInngestEnabledForSend } from "@/inngest/client";

export async function enqueueKnowledgeProcessing(sourceId: string): Promise<void> {
  if (!isInngestEnabledForSend()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[enqueueKnowledgeProcessing] Inngest event skipped. Set INNGEST_DEV=1 and run npm run inngest:dev.",
      );
    }
    return;
  }

  await inngest.send({
    name: "knowledge/source.pending",
    data: { sourceId },
  });
}
