import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { getInngestSigningKey, isInngestDevMode } from "@/shared/config/env";
import { processExportJob } from "@/inngest/functions/export-jobs";
import { retentionPurge } from "@/inngest/functions/retention-purge";
import {
  notifyEmployeeCreated,
  notifyKnowledgeFailed,
  notifySessionCompleted,
  sendWeeklyDigest,
} from "@/inngest/functions/notifications";

const signingKey = getInngestSigningKey();

if (process.env.NODE_ENV === "production" && !signingKey) {
  throw new Error("INNGEST_SIGNING_KEY is required in production");
}

export const runtime = "nodejs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  ...(signingKey ? { signingKey } : {}),
  ...(isInngestDevMode() ? {} : { enableUnauthedSync: false }),
  functions: [
    sendWeeklyDigest,
    notifySessionCompleted,
    notifyKnowledgeFailed,
    notifyEmployeeCreated,
    processExportJob,
    retentionPurge,
  ],
});
