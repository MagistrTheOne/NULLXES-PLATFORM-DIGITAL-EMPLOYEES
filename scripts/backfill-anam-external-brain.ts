import { eq } from "drizzle-orm";
import type { AvatarProviderConfigPayload } from "@/entities/provider-config";
import { employeeProviderConfig } from "@/entities/provider-config/schema";
import { ANAM_EXTERNAL_LLM_ID } from "@/features/provider-provisioning/types";
import { syncAnamPersonaExternalBrain } from "@/features/provider-provisioning/services/sync-anam-persona-external-brain";
import { loadEnvFiles } from "@/shared/config/load-env-files";
import { db } from "@/shared/db/client";

loadEnvFiles();

function needsExternalBrainSync(config: AvatarProviderConfigPayload): boolean {
  if (!config.personaId) {
    return false;
  }

  const metadata = config.providerMetadata;
  if (!metadata || typeof metadata !== "object") {
    return true;
  }

  return (
    typeof metadata.externalBrainSyncedAt !== "string" ||
    metadata.externalBrainLlmId !== ANAM_EXTERNAL_LLM_ID
  );
}

async function backfillAnamExternalBrain(): Promise<void> {
  const rows = await db
    .select()
    .from(employeeProviderConfig)
    .where(eq(employeeProviderConfig.providerType, "avatar"));

  let synced = 0;
  let skipped = 0;

  for (const row of rows) {
    const config = row.config as AvatarProviderConfigPayload;
    if (!needsExternalBrainSync(config)) {
      skipped += 1;
      continue;
    }

    await syncAnamPersonaExternalBrain({
      personaId: config.personaId!,
      employeeId: row.employeeId,
    });
    synced += 1;
  }

  console.log(
    `Anam external-brain backfill complete: synced=${synced}, skipped=${skipped}`,
  );
}

backfillAnamExternalBrain().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Anam external-brain backfill failed:", message);
  process.exit(1);
});
