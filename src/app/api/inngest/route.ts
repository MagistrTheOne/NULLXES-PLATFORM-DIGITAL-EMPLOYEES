import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processExportJob } from "@/inngest/functions/export-jobs";
import {
  notifyKnowledgeFailed,
  notifySessionCompleted,
  sendWeeklyDigest,
} from "@/inngest/functions/notifications";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendWeeklyDigest,
    notifySessionCompleted,
    notifyKnowledgeFailed,
    processExportJob,
  ],
});
