import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { getInngestSigningKey } from "@/shared/config/env";
import { processExportJob } from "@/inngest/functions/export-jobs";
import { retentionPurge } from "@/inngest/functions/retention-purge";
import {
  notifyEmployeeCreated,
  notifyKnowledgeFailed,
  notifySessionCompleted,
  sendWeeklyDigest,
} from "@/inngest/functions/notifications";

const signingKey = getInngestSigningKey();

export const { GET, POST, PUT } = serve({
  client: inngest,
  ...(signingKey ? { signingKey } : {}),
  functions: [
    sendWeeklyDigest,
    notifySessionCompleted,
    notifyKnowledgeFailed,
    notifyEmployeeCreated,
    processExportJob,
    retentionPurge,
  ],
});
