import { inngest, isInngestEnabledForSend } from "@/inngest/client";

export async function enqueueKnowledgeProcessing(sourceId: string): Promise<void> {
  if (!isInngestEnabledForSend()) {
    return;
  }

  await inngest.send({
    name: "knowledge/source.pending",
    data: { sourceId },
  });
}
